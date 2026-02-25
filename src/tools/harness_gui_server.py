"""Local HTTP server for the workshop harness GUI bridge."""

from __future__ import annotations

import argparse
import json
import mimetypes
import os
import re
from datetime import datetime, timezone
from decimal import Decimal
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import parse_qs, unquote, urlparse

from src.aws_tool.cli import handle_request as aws_tool_handle_request
from src.graph.context_graph import GraphStore, MissingTableError
from src.orchestrator.bedrock_harness import (
    BedrockHarnessConfig,
    DEFAULT_SYSTEM_PROMPT,
    run_bedrock_harness,
)

HOST = "127.0.0.1"
ALLOWED_PHASES = {"PLAN", "ACT", "VERIFY"}
DEFAULT_STATIC_ROOT = Path(__file__).resolve().parents[2] / "docs" / "workshop" / "gui"
CHAT_SPEC_MAX_ELEMENTS = 96
CHAT_SPEC_MAX_CHILDREN = 32
CHAT_SPEC_MAX_EVENT_ITEMS = 80
CHAT_SPEC_MAX_GRAPH_ITEMS = 120
CHAT_ALLOWED_COMPONENTS: dict[str, dict[str, Any]] = {
    "Stack": {"props": {}},
    "DashboardGrid": {"props": {}},
    "Panel": {"props": {"title": "string", "subtitle": "string|null", "span": "'1'|'2'|null"}},
    "RunSummary": {
        "props": {
            "status": "string",
            "steps": "string",
            "requestStatus": "string",
            "finalResponse": "string",
        }
    },
    "EventList": {
        "props": {
            "emptyLabel": "string",
            "items": "[{title:string,meta:string,body:string,tone:'default'|'ok'|'error'|null}]",
        }
    },
    "GraphStats": {"props": {"nodeCount": "string", "edgeCount": "string", "updatedAt": "string"}},
    "GraphView": {"props": {"nodes": "[object]", "edges": "[object]"}},
    "JsonBlock": {"props": {"label": "string", "value": "any"}},
}
DEFAULT_CHAT_SYSTEM_PROMPT = (
    "You are the workshop chat+ui assistant.\n"
    "Return ONLY a single JSON object with this exact shape:\n"
    '{"assistant_text":"<string>","ui":{"mode":"none|spec","reason":"<string>","spec":<object|null>}}\n'
    "Rules:\n"
    "- Never output markdown fences, prose wrappers, or extra keys.\n"
    "- If ui.mode='none', set ui.spec=null and provide ui.reason.\n"
    "- If ui.mode='spec', provide a valid json-render spec with top-level keys: root, elements, optional state.\n"
    "- Use ONLY allowed component types and prop contracts from this catalog JSON:\n"
    f"{json.dumps(CHAT_ALLOWED_COMPONENTS, sort_keys=True)}\n"
    "- Prefer concise specs. Do not exceed 80 elements.\n"
    "- If unsure, choose ui.mode='none'."
)


class APIError(Exception):
    """Structured API error for consistent JSON responses."""

    def __init__(
        self,
        *,
        status: HTTPStatus,
        code: str,
        message: str,
        hint: str | None = None,
        details: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(message)
        self.status = status
        self.code = code
        self.message = message
        self.hint = hint
        self.details = details


def _now_utc_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _error_payload(error: APIError) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "ok": False,
        "error": {
            "code": error.code,
            "message": error.message,
        },
    }
    if error.hint:
        payload["error"]["hint"] = error.hint
    if error.details:
        payload["error"]["details"] = error.details
    return payload


def _json_safe(value: Any) -> Any:
    """Convert non-JSON-native values from DynamoDB into serializable types."""
    if isinstance(value, Decimal):
        return int(value) if value % 1 == 0 else float(value)
    if isinstance(value, dict):
        return {str(key): _json_safe(item) for key, item in value.items()}
    if isinstance(value, list):
        return [_json_safe(item) for item in value]
    return value


def _require_json_object(value: Any, field: str) -> dict[str, Any]:
    if not isinstance(value, dict):
        raise APIError(
            status=HTTPStatus.BAD_REQUEST,
            code="invalid_json_shape",
            message=f"'{field}' must be a JSON object.",
            hint=f"Send a JSON object for '{field}'.",
        )
    return value


def _coerce_int(value: Any, *, field: str, minimum: int) -> int:
    try:
        coerced = int(value)
    except (TypeError, ValueError) as exc:
        raise APIError(
            status=HTTPStatus.BAD_REQUEST,
            code="invalid_number",
            message=f"'{field}' must be an integer.",
            hint=f"Provide a numeric value for '{field}'.",
        ) from exc
    if coerced < minimum:
        raise APIError(
            status=HTTPStatus.BAD_REQUEST,
            code="invalid_number_range",
            message=f"'{field}' must be >= {minimum}.",
            hint=f"Increase '{field}' to at least {minimum}.",
        )
    return coerced


def _coerce_float(value: Any, *, field: str) -> float:
    try:
        return float(value)
    except (TypeError, ValueError) as exc:
        raise APIError(
            status=HTTPStatus.BAD_REQUEST,
            code="invalid_number",
            message=f"'{field}' must be a number.",
            hint=f"Provide a numeric value for '{field}'.",
        ) from exc


def _coerce_bool(value: Any, *, field: str) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)):
        return bool(value)
    if isinstance(value, str):
        normalized = value.strip().lower()
        if normalized in {"1", "true", "yes", "y", "on"}:
            return True
        if normalized in {"0", "false", "no", "n", "off"}:
            return False
    raise APIError(
        status=HTTPStatus.BAD_REQUEST,
        code="invalid_boolean",
        message=f"'{field}' must be a boolean.",
        hint=f"Use true/false for '{field}'.",
    )


def _parse_phase(raw_phase: Any, *, field: str = "phase", default: str = "PLAN") -> str:
    if raw_phase is None:
        phase = default
    else:
        phase = str(raw_phase).strip().upper()
    if phase not in ALLOWED_PHASES:
        raise APIError(
            status=HTTPStatus.BAD_REQUEST,
            code="invalid_phase",
            message=f"'{field}' must be one of {sorted(ALLOWED_PHASES)}.",
            hint="Use PLAN, ACT, or VERIFY.",
        )
    return phase


def _parse_limit(query: dict[str, list[str]]) -> int | None:
    values = query.get("limit")
    if not values:
        return None
    raw = values[0].strip()
    if not raw:
        return None
    return _coerce_int(raw, field="limit", minimum=1)


def _resolve_run_id(payload: dict[str, Any], *, field_hint: str) -> str:
    run_id = str(
        payload.get("run_id")
        or payload.get("session")
        or payload.get("session_id")
        or payload.get("id")
        or ""
    ).strip()
    if not run_id:
        raise APIError(
            status=HTTPStatus.BAD_REQUEST,
            code="missing_run_id",
            message="Missing required field 'run_id'.",
            hint=f"Set 'run_id' (or alias 'session') in {field_hint}.",
        )
    return run_id


def _truncate_text(value: str, *, max_chars: int) -> str:
    if len(value) <= max_chars:
        return value
    return value[: max_chars - 1].rstrip() + "..."


def _parse_json_object_from_text(raw_text: str) -> tuple[dict[str, Any] | None, str | None]:
    stripped = raw_text.strip()
    if not stripped:
        return None, "model_response_empty"

    try:
        direct = json.loads(stripped)
        if isinstance(direct, dict):
            return direct, None
    except json.JSONDecodeError:
        pass

    # First pass: structured decode from the first parseable "{" position.
    decoder = json.JSONDecoder()
    for idx, char in enumerate(stripped):
        if char != "{":
            continue
        try:
            candidate, _ = decoder.raw_decode(stripped[idx:])
        except json.JSONDecodeError:
            continue
        if isinstance(candidate, dict):
            return candidate, "model_response_had_wrapping_text"

    # Fallback: greedily strip code fences if present and retry.
    fenced = re.sub(r"^```(?:json)?\s*|\s*```$", "", stripped, flags=re.IGNORECASE | re.MULTILINE).strip()
    if fenced and fenced != stripped:
        try:
            candidate = json.loads(fenced)
            if isinstance(candidate, dict):
                return candidate, "model_response_was_fenced"
        except json.JSONDecodeError:
            pass

    return None, "model_response_not_json_object"


def _validate_ui_spec(spec: Any) -> tuple[bool, str | None]:
    if not isinstance(spec, dict):
        return False, "ui.spec must be a JSON object."

    top_level_allowed = {"root", "elements", "state"}
    extra_top = set(spec.keys()) - top_level_allowed
    if extra_top:
        return False, f"ui.spec contains unsupported top-level keys: {sorted(extra_top)}."

    root = spec.get("root")
    if not isinstance(root, str) or not root.strip():
        return False, "ui.spec.root must be a non-empty string."

    elements = spec.get("elements")
    if not isinstance(elements, dict) or not elements:
        return False, "ui.spec.elements must be a non-empty object."

    if len(elements) > CHAT_SPEC_MAX_ELEMENTS:
        return False, f"ui.spec.elements exceeds max size ({CHAT_SPEC_MAX_ELEMENTS})."

    if root not in elements:
        return False, "ui.spec.root must reference an existing element id."

    element_allowed_keys = {"type", "props", "children", "visible"}
    for element_id, element in elements.items():
        if not isinstance(element_id, str) or not element_id.strip():
            return False, "Each element key must be a non-empty string."
        if not isinstance(element, dict):
            return False, f"Element '{element_id}' must be an object."

        extra_element_keys = set(element.keys()) - element_allowed_keys
        if extra_element_keys:
            return False, f"Element '{element_id}' has unsupported keys: {sorted(extra_element_keys)}."

        component_name = element.get("type")
        if not isinstance(component_name, str) or component_name not in CHAT_ALLOWED_COMPONENTS:
            return False, f"Element '{element_id}' uses unsupported component '{component_name}'."

        props = element.get("props")
        if not isinstance(props, dict):
            return False, f"Element '{element_id}' props must be an object."

        is_valid, reason = _validate_component_props(component_name, props)
        if not is_valid:
            return False, f"Element '{element_id}' invalid props: {reason}"

        children = element.get("children", [])
        if children is None:
            children = []
        if not isinstance(children, list):
            return False, f"Element '{element_id}' children must be a list."
        if len(children) > CHAT_SPEC_MAX_CHILDREN:
            return False, (
                f"Element '{element_id}' children exceeds max size ({CHAT_SPEC_MAX_CHILDREN})."
            )
        for child in children:
            if not isinstance(child, str) or not child.strip():
                return False, f"Element '{element_id}' contains invalid child reference."
            if child not in elements:
                return False, f"Element '{element_id}' references unknown child '{child}'."

    return True, None


def _validate_component_props(component_name: str, props: dict[str, Any]) -> tuple[bool, str | None]:
    def require_keys(required: set[str]) -> tuple[bool, str | None]:
        missing = sorted(required - set(props.keys()))
        if missing:
            return False, f"missing required keys {missing}"
        return True, None

    def reject_extra(allowed: set[str]) -> tuple[bool, str | None]:
        extra = sorted(set(props.keys()) - allowed)
        if extra:
            return False, f"unsupported keys {extra}"
        return True, None

    def expect_string(key: str, *, allow_none: bool = False, max_chars: int = 4000) -> tuple[bool, str | None]:
        value = props.get(key)
        if value is None and allow_none:
            return True, None
        if not isinstance(value, str):
            return False, f"'{key}' must be a string"
        if len(value) > max_chars:
            return False, f"'{key}' exceeds {max_chars} chars"
        return True, None

    if component_name in {"Stack", "DashboardGrid"}:
        if props:
            return False, "must not define props"
        return True, None

    if component_name == "Panel":
        ok, reason = require_keys({"title"})
        if not ok:
            return ok, reason
        ok, reason = reject_extra({"title", "subtitle", "span"})
        if not ok:
            return ok, reason
        ok, reason = expect_string("title", max_chars=240)
        if not ok:
            return ok, reason
        ok, reason = expect_string("subtitle", allow_none=True, max_chars=500)
        if not ok:
            return ok, reason
        span = props.get("span")
        if span not in {None, "1", "2"}:
            return False, "'span' must be '1', '2', or null"
        return True, None

    if component_name == "RunSummary":
        ok, reason = require_keys({"status", "steps", "requestStatus", "finalResponse"})
        if not ok:
            return ok, reason
        ok, reason = reject_extra({"status", "steps", "requestStatus", "finalResponse"})
        if not ok:
            return ok, reason
        for key in ("status", "steps", "requestStatus", "finalResponse"):
            ok, reason = expect_string(key, max_chars=6000)
            if not ok:
                return ok, reason
        return True, None

    if component_name == "EventList":
        ok, reason = require_keys({"emptyLabel", "items"})
        if not ok:
            return ok, reason
        ok, reason = reject_extra({"emptyLabel", "items"})
        if not ok:
            return ok, reason
        ok, reason = expect_string("emptyLabel", max_chars=400)
        if not ok:
            return ok, reason
        items = props.get("items")
        if not isinstance(items, list):
            return False, "'items' must be a list"
        if len(items) > CHAT_SPEC_MAX_EVENT_ITEMS:
            return False, f"'items' exceeds {CHAT_SPEC_MAX_EVENT_ITEMS}"
        for idx, item in enumerate(items):
            if not isinstance(item, dict):
                return False, f"item {idx} must be an object"
            required_item_keys = {"title", "meta", "body"}
            missing_item = required_item_keys - set(item.keys())
            if missing_item:
                return False, f"item {idx} missing keys {sorted(missing_item)}"
            extra_item = set(item.keys()) - {"title", "meta", "body", "tone"}
            if extra_item:
                return False, f"item {idx} has unsupported keys {sorted(extra_item)}"
            for key in ("title", "meta", "body"):
                value = item.get(key)
                if not isinstance(value, str):
                    return False, f"item {idx} '{key}' must be a string"
                if len(value) > 4000:
                    return False, f"item {idx} '{key}' exceeds 4000 chars"
            tone = item.get("tone")
            if tone not in {None, "default", "ok", "error"}:
                return False, f"item {idx} 'tone' must be default|ok|error|null"
        return True, None

    if component_name == "GraphStats":
        ok, reason = require_keys({"nodeCount", "edgeCount", "updatedAt"})
        if not ok:
            return ok, reason
        ok, reason = reject_extra({"nodeCount", "edgeCount", "updatedAt"})
        if not ok:
            return ok, reason
        for key in ("nodeCount", "edgeCount", "updatedAt"):
            ok, reason = expect_string(key, max_chars=200)
            if not ok:
                return ok, reason
        return True, None

    if component_name == "GraphView":
        ok, reason = require_keys({"nodes", "edges"})
        if not ok:
            return ok, reason
        ok, reason = reject_extra({"nodes", "edges"})
        if not ok:
            return ok, reason
        nodes = props.get("nodes")
        edges = props.get("edges")
        if not isinstance(nodes, list) or not all(isinstance(item, dict) for item in nodes):
            return False, "'nodes' must be a list of objects"
        if not isinstance(edges, list) or not all(isinstance(item, dict) for item in edges):
            return False, "'edges' must be a list of objects"
        if len(nodes) > CHAT_SPEC_MAX_GRAPH_ITEMS or len(edges) > CHAT_SPEC_MAX_GRAPH_ITEMS:
            return (
                False,
                f"'nodes' and 'edges' must each be <= {CHAT_SPEC_MAX_GRAPH_ITEMS}",
            )
        return True, None

    if component_name == "JsonBlock":
        ok, reason = require_keys({"label", "value"})
        if not ok:
            return ok, reason
        ok, reason = reject_extra({"label", "value"})
        if not ok:
            return ok, reason
        ok, reason = expect_string("label", max_chars=240)
        if not ok:
            return ok, reason
        return True, None

    return False, f"unknown component '{component_name}'"


def _normalize_chat_request(payload: dict[str, Any]) -> dict[str, Any]:
    run_id = _resolve_run_id(payload, field_hint="/api/chat")
    message = payload.get("message")
    if not isinstance(message, str) or not message.strip():
        raise APIError(
            status=HTTPStatus.BAD_REQUEST,
            code="missing_message",
            message="Missing required field 'message'.",
            hint="Provide a non-empty chat message.",
        )

    request: dict[str, Any] = {
        "run_id": run_id,
        "phase": _parse_phase(payload.get("phase"), default="PLAN"),
        "session_key": str(payload.get("session_key") or "chat-main").strip() or "chat-main",
        "message": message.strip(),
        "max_tokens": _coerce_int(payload.get("max_tokens", 900), field="max_tokens", minimum=1),
        "max_history_turns": _coerce_int(
            payload.get("max_history_turns", 12), field="max_history_turns", minimum=0
        ),
        "temperature": _coerce_float(payload.get("temperature", 0.15), field="temperature"),
        "reset_session": _coerce_bool(payload.get("reset_session"), field="reset_session")
        if "reset_session" in payload
        else False,
    }
    model_id_raw = payload.get("model_id")
    if isinstance(model_id_raw, str) and model_id_raw.strip():
        request["model_id"] = model_id_raw.strip()
    system_prompt_raw = payload.get("system_prompt")
    if isinstance(system_prompt_raw, str) and system_prompt_raw.strip():
        request["system_prompt"] = system_prompt_raw.strip()
    else:
        request["system_prompt"] = DEFAULT_CHAT_SYSTEM_PROMPT
    return request


def _build_chat_prompt(request: dict[str, Any]) -> str:
    return (
        "Generate a response for this workshop chat turn.\n"
        f"run_id: {request['run_id']}\n"
        f"phase: {request['phase']}\n"
        f"session_key: {request['session_key']}\n"
        "User message:\n"
        f"{request['message']}\n\n"
        "Return the strict JSON envelope now."
    )


def _extract_user_message_from_prompt(prompt: str) -> str:
    text = prompt.strip()
    if not text:
        return ""
    marker = "User message:\n"
    if marker not in text:
        return text
    after = text.split(marker, 1)[1]
    tail = "\n\nReturn the strict JSON envelope now."
    if tail in after:
        return after.split(tail, 1)[0].strip()
    return after.strip()


def _parse_chat_model_output(raw_model_text: str) -> dict[str, Any]:
    candidate, parse_note = _parse_json_object_from_text(raw_model_text)
    parse_ok = isinstance(candidate, dict)

    assistant_text = _truncate_text(raw_model_text.strip(), max_chars=6000)
    ui_mode = "none"
    ui_reason = "Model output could not be parsed as contract JSON."
    ui_spec: dict[str, Any] | None = None
    ui_validate_ok = False
    ui_rejection_reason = parse_note or "model_response_not_json_object"

    if parse_ok and candidate is not None:
        candidate_text = candidate.get("assistant_text")
        if isinstance(candidate_text, str) and candidate_text.strip():
            assistant_text = _truncate_text(candidate_text.strip(), max_chars=6000)

        ui_raw = candidate.get("ui")
        if isinstance(ui_raw, dict):
            requested_mode = str(ui_raw.get("mode") or "none").strip().lower()
            requested_reason = ui_raw.get("reason")
            requested_reason_text = str(requested_reason).strip() if isinstance(requested_reason, str) else ""
            if requested_mode == "spec":
                is_valid, reason = _validate_ui_spec(ui_raw.get("spec"))
                if is_valid:
                    ui_mode = "spec"
                    ui_reason = requested_reason_text or "Model selected structured UI rendering."
                    ui_spec = ui_raw.get("spec")
                    ui_validate_ok = True
                    ui_rejection_reason = ""
                else:
                    ui_mode = "none"
                    ui_reason = requested_reason_text or "Invalid ui.spec; falling back to text."
                    ui_spec = None
                    ui_validate_ok = False
                    ui_rejection_reason = reason or "ui_spec_validation_failed"
            else:
                ui_mode = "none"
                ui_reason = requested_reason_text or "Model selected text-only response."
                ui_spec = None
                ui_validate_ok = True
                ui_rejection_reason = ""
        else:
            ui_mode = "none"
            ui_reason = "Contract JSON missing 'ui' object; rendering text only."
            ui_spec = None
            ui_validate_ok = False
            ui_rejection_reason = "missing_ui_object"

    return {
        "assistant_text": assistant_text or "No assistant text returned.",
        "ui": {
            "mode": ui_mode,
            "reason": ui_reason,
            "spec": ui_spec,
        },
        "ui_parse_ok": parse_ok,
        "ui_validate_ok": ui_validate_ok,
        "ui_rendered": ui_mode == "spec" and ui_spec is not None,
        "ui_rejection_reason": ui_rejection_reason,
    }


def _node_data(node: dict[str, Any]) -> dict[str, Any]:
    data = node.get("data")
    return data if isinstance(data, dict) else {}


def _node_turn_timestamp(node: dict[str, Any]) -> datetime:
    data = _node_data(node)
    for candidate in (
        node.get("updated_at"),
        node.get("created_at"),
        data.get("ts_utc"),
        data.get("finished_at"),
        data.get("started_at"),
    ):
        if not candidate:
            continue
        try:
            parsed = datetime.fromisoformat(str(candidate).replace("Z", "+00:00"))
            if parsed.tzinfo is None:
                parsed = parsed.replace(tzinfo=timezone.utc)
            return parsed
        except ValueError:
            continue
    return datetime.fromtimestamp(0, tz=timezone.utc)


def _node_turn_index(node: dict[str, Any]) -> int:
    raw_value = _node_data(node).get("turn_index", 0)
    try:
        return int(raw_value)
    except (TypeError, ValueError):
        return 0


def _parse_harness_config(payload: dict[str, Any]) -> BedrockHarnessConfig:
    run_id = str(
        payload.get("run_id")
        or payload.get("session")
        or payload.get("session_id")
        or payload.get("id")
        or ""
    ).strip()
    if not run_id:
        raise APIError(
            status=HTTPStatus.BAD_REQUEST,
            code="missing_run_id",
            message="Missing required field 'run_id'.",
            hint="Set 'run_id' (or alias 'session') in /api/harness/run.",
        )

    goal = payload.get("goal")
    if not isinstance(goal, str) or not goal.strip():
        raise APIError(
            status=HTTPStatus.BAD_REQUEST,
            code="missing_goal",
            message="Missing required field 'goal'.",
            hint="Provide a non-empty goal string.",
        )

    include_external_stubs = True
    if "include_external_stubs" in payload:
        include_external_stubs = _coerce_bool(
            payload.get("include_external_stubs"), field="include_external_stubs"
        )
    elif "no_external_stubs" in payload:
        include_external_stubs = not _coerce_bool(
            payload.get("no_external_stubs"), field="no_external_stubs"
        )

    model_id_raw = payload.get("model_id")
    model_id = str(model_id_raw).strip() if model_id_raw else None
    system_prompt_raw = payload.get("system_prompt")
    system_prompt = (
        str(system_prompt_raw).strip()
        if isinstance(system_prompt_raw, str) and system_prompt_raw.strip()
        else DEFAULT_SYSTEM_PROMPT
    )

    return BedrockHarnessConfig(
        run_id=run_id,
        phase=_parse_phase(payload.get("phase"), default="PLAN"),
        goal=goal.strip(),
        session_key=str(payload.get("session_key") or "harness-main").strip() or "harness-main",
        model_id=model_id,
        system_prompt=system_prompt,
        max_steps=_coerce_int(payload.get("max_steps", 6), field="max_steps", minimum=1),
        max_history_turns=_coerce_int(
            payload.get("max_history_turns", 8), field="max_history_turns", minimum=0
        ),
        max_tokens=_coerce_int(payload.get("max_tokens", 400), field="max_tokens", minimum=1),
        temperature=_coerce_float(payload.get("temperature", 0.0), field="temperature"),
        include_external_stubs=include_external_stubs,
    )


def _normalize_skill_request(payload: dict[str, Any]) -> dict[str, Any]:
    skill = payload.get("skill")
    if not isinstance(skill, str) or not skill.strip():
        raise APIError(
            status=HTTPStatus.BAD_REQUEST,
            code="missing_skill",
            message="Missing required field 'skill'.",
            hint="Set 'skill' to an allowlisted aws_tool skill name.",
        )

    skill_input = payload.get("input")
    if not isinstance(skill_input, dict):
        raise APIError(
            status=HTTPStatus.BAD_REQUEST,
            code="missing_input",
            message="Missing required field 'input'.",
            hint="Set 'input' to a JSON object payload for the skill.",
        )

    request: dict[str, Any] = {"skill": skill.strip(), "input": skill_input}
    if "phase" in payload:
        request["phase"] = _parse_phase(payload.get("phase"))
    if "session" in payload and payload.get("session") is not None:
        request["session"] = str(payload.get("session")).strip()
    return request


class HarnessGUIHandler(BaseHTTPRequestHandler):
    """HTTP request handler for local harness GUI development."""

    static_root = DEFAULT_STATIC_ROOT.resolve()
    server_version = "HarnessGUIServer/0.1"

    def do_OPTIONS(self) -> None:  # noqa: N802
        self._send_bytes(status=HTTPStatus.NO_CONTENT, body=b"", content_type="text/plain; charset=utf-8")

    def do_GET(self) -> None:  # noqa: N802
        parsed = urlparse(self.path)
        try:
            if parsed.path.startswith("/api/"):
                self._handle_api_get(parsed.path, parse_qs(parsed.query))
                return
            self._serve_static(parsed.path)
        except APIError as exc:
            self._send_json(exc.status, _error_payload(exc))
        except MissingTableError as exc:
            self._send_json(
                HTTPStatus.SERVICE_UNAVAILABLE,
                _error_payload(
                    APIError(
                        status=HTTPStatus.SERVICE_UNAVAILABLE,
                        code="graph_store_unavailable",
                        message=str(exc),
                        hint="Provision GraphNodes/GraphEdges or set CEW_MOCK_AWS=1 for local mock mode.",
                    )
                ),
            )
        except Exception as exc:  # pragma: no cover - defensive fallback
            self._send_json(
                HTTPStatus.INTERNAL_SERVER_ERROR,
                _error_payload(
                    APIError(
                        status=HTTPStatus.INTERNAL_SERVER_ERROR,
                        code="internal_error",
                        message=f"Unhandled server error: {exc}",
                        hint="Check server logs and retry.",
                    )
                ),
            )

    def do_POST(self) -> None:  # noqa: N802
        parsed = urlparse(self.path)
        try:
            if parsed.path == "/api/harness/run":
                self._handle_harness_run()
                return
            if parsed.path == "/api/chat":
                self._handle_chat()
                return
            if parsed.path == "/api/skill/run":
                self._handle_skill_run()
                return
            raise APIError(
                status=HTTPStatus.NOT_FOUND,
                code="route_not_found",
                message=f"Unknown API route '{parsed.path}'.",
                hint="Use /api/harness/run, /api/chat, or /api/skill/run.",
            )
        except APIError as exc:
            self._send_json(exc.status, _error_payload(exc))
        except MissingTableError as exc:
            self._send_json(
                HTTPStatus.SERVICE_UNAVAILABLE,
                _error_payload(
                    APIError(
                        status=HTTPStatus.SERVICE_UNAVAILABLE,
                        code="graph_store_unavailable",
                        message=str(exc),
                        hint="Provision GraphNodes/GraphEdges or set CEW_MOCK_AWS=1 for local mock mode.",
                    )
                ),
            )
        except Exception as exc:  # pragma: no cover - defensive fallback
            self._send_json(
                HTTPStatus.INTERNAL_SERVER_ERROR,
                _error_payload(
                    APIError(
                        status=HTTPStatus.INTERNAL_SERVER_ERROR,
                        code="internal_error",
                        message=f"Unhandled server error: {exc}",
                        hint="Check server logs and retry.",
                    )
                ),
            )

    def log_message(self, format: str, *args: Any) -> None:  # noqa: A003
        message = "%s - - [%s] %s\n" % (self.address_string(), self.log_date_time_string(), format % args)
        print(message, end="")

    def _send_json(self, status: HTTPStatus, payload: dict[str, Any]) -> None:
        encoded = json.dumps(
            _json_safe(payload),
            ensure_ascii=True,
            indent=2,
            sort_keys=True,
        ).encode("utf-8")
        self._send_bytes(status=status, body=encoded, content_type="application/json; charset=utf-8")

    def _send_bytes(self, *, status: HTTPStatus, body: bytes, content_type: str) -> None:
        self.send_response(int(status))
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        # TODO: tighten CORS to an explicit localhost allowlist when GUI auth is added.
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        if self.command != "HEAD" and body:
            self.wfile.write(body)

    def _read_json_body(self) -> dict[str, Any]:
        content_length = self.headers.get("Content-Length")
        if content_length is None:
            raise APIError(
                status=HTTPStatus.BAD_REQUEST,
                code="missing_content_length",
                message="Missing Content-Length header.",
                hint="POST requests must include a JSON body.",
            )

        byte_count = _coerce_int(content_length, field="Content-Length", minimum=1)
        raw_body = self.rfile.read(byte_count)
        try:
            decoded = raw_body.decode("utf-8")
        except UnicodeDecodeError as exc:
            raise APIError(
                status=HTTPStatus.BAD_REQUEST,
                code="invalid_encoding",
                message="Request body must be UTF-8 JSON.",
                hint="Encode request payload as UTF-8.",
            ) from exc

        try:
            payload = json.loads(decoded)
        except json.JSONDecodeError as exc:
            raise APIError(
                status=HTTPStatus.BAD_REQUEST,
                code="invalid_json",
                message=f"Malformed JSON body: {exc}",
                hint="Send valid JSON with double-quoted keys/strings.",
            ) from exc
        return _require_json_object(payload, "body")

    def _handle_api_get(self, path: str, query: dict[str, list[str]]) -> None:
        if path == "/api/health":
            self._send_json(
                HTTPStatus.OK,
                {
                    "ok": True,
                    "service": "harness_gui_server",
                    "status": "healthy",
                    "time_utc": _now_utc_iso(),
                },
            )
            return

        session_id, resource_parts = self._parse_session_route(path)
        if resource_parts == ["graph"]:
            self._handle_session_graph(session_id=session_id, query=query)
            return
        if resource_parts == ["memory"]:
            self._handle_session_memory(session_id=session_id, query=query)
            return
        if len(resource_parts) >= 1 and resource_parts[0] == "chat":
            self._handle_session_chat(session_id=session_id, resource_parts=resource_parts[1:], query=query)
            return

        raise APIError(
            status=HTTPStatus.NOT_FOUND,
            code="route_not_found",
            message=f"Unknown session route '{path}'.",
            hint=(
                "Use /api/session/{session_id}/graph, /api/session/{session_id}/memory, "
                "or /api/session/{session_id}/chat/threads."
            ),
        )

    def _parse_session_route(self, path: str) -> tuple[str, list[str]]:
        parts = [part for part in path.split("/") if part]
        if len(parts) < 4 or parts[0] != "api" or parts[1] != "session":
            raise APIError(
                status=HTTPStatus.NOT_FOUND,
                code="route_not_found",
                message=f"Unknown API route '{path}'.",
                hint=(
                    "Use /api/health, /api/session/{session_id}/graph, "
                    "/api/session/{session_id}/memory, or /api/session/{session_id}/chat/threads."
                ),
            )
        session_id = unquote(parts[2]).strip()
        if not session_id:
            raise APIError(
                status=HTTPStatus.BAD_REQUEST,
                code="missing_session_id",
                message="Session id is required in the route.",
                hint="Call /api/session/{session_id}/...",
            )
        return session_id, parts[3:]

    def _handle_session_graph(self, *, session_id: str, query: dict[str, list[str]]) -> None:
        limit = _parse_limit(query)
        # TODO: replace direct GraphStore reads with a dedicated graph read API once available.
        graph_store = GraphStore()
        session_graph = graph_store.list_session(session_id)
        nodes = list(session_graph.get("nodes", []))
        edges = list(session_graph.get("edges", []))
        if limit is not None:
            nodes = nodes[:limit]
            edges = edges[:limit]
        self._send_json(
            HTTPStatus.OK,
            {
                "ok": True,
                "session_id": session_id,
                "nodes": nodes,
                "edges": edges,
                "counts": {"nodes": len(nodes), "edges": len(edges)},
            },
        )

    def _handle_session_memory(self, *, session_id: str, query: dict[str, list[str]]) -> None:
        session_key = (query.get("session_key") or [""])[0].strip()
        if not session_key:
            raise APIError(
                status=HTTPStatus.BAD_REQUEST,
                code="missing_session_key",
                message="Query parameter 'session_key' is required.",
                hint="Call /api/session/{session_id}/memory?session_key=your-key.",
            )

        # TODO: move memory filtering server-side into GraphStore query once indexed lookups are added.
        graph_store = GraphStore()
        nodes = list(graph_store.list_session(session_id).get("nodes", []))
        memory_nodes = []
        for node in nodes:
            if str(node.get("type")) != "Decision":
                continue
            data = _node_data(node)
            if str(data.get("kind") or "") != "bedrock_turn":
                continue
            if str(data.get("session_key") or "default") != session_key:
                continue
            memory_nodes.append(node)

        memory_nodes.sort(
            key=lambda node: (
                _node_turn_index(node),
                _node_turn_timestamp(node).timestamp(),
            )
        )

        self._send_json(
            HTTPStatus.OK,
            {
                "ok": True,
                "session_id": session_id,
                "session_key": session_key,
                "nodes": memory_nodes,
                "count": len(memory_nodes),
            },
        )

    def _list_bedrock_turn_nodes(
        self, *, session_id: str, session_key: str | None = None
    ) -> list[dict[str, Any]]:
        # TODO: replace session scan with indexed lookup when chat history volume grows.
        graph_store = GraphStore()
        nodes = list(graph_store.list_session(session_id).get("nodes", []))
        turns: list[dict[str, Any]] = []
        for node in nodes:
            if str(node.get("type")) != "Decision":
                continue
            data = _node_data(node)
            if str(data.get("kind") or "") != "bedrock_turn":
                continue
            key = str(data.get("session_key") or "default")
            if session_key is not None and key != session_key:
                continue
            turns.append(node)

        turns.sort(
            key=lambda node: (
                str(_node_data(node).get("session_key") or "default"),
                _node_turn_index(node),
                _node_turn_timestamp(node).timestamp(),
            )
        )
        return turns

    def _handle_session_chat(
        self, *, session_id: str, resource_parts: list[str], query: dict[str, list[str]]
    ) -> None:
        if not resource_parts or resource_parts == ["threads"]:
            self._handle_session_chat_threads(session_id=session_id)
            return
        if resource_parts == ["history"] or resource_parts == ["turns"]:
            self._handle_session_chat_history(session_id=session_id, query=query)
            return

        suffix = "/".join(resource_parts)
        raise APIError(
            status=HTTPStatus.NOT_FOUND,
            code="route_not_found",
            message=f"Unknown chat route '/api/session/{session_id}/chat/{suffix}'.",
            hint="Use /api/session/{session_id}/chat/threads or /api/session/{session_id}/chat/history.",
        )

    def _handle_session_chat_threads(self, *, session_id: str) -> None:
        turns = self._list_bedrock_turn_nodes(session_id=session_id)
        buckets: dict[str, dict[str, Any]] = {}
        for node in turns:
            data = _node_data(node)
            session_key = str(data.get("session_key") or "default")
            bucket = buckets.get(session_key)
            if bucket is None:
                bucket = {
                    "session_key": session_key,
                    "turn_count": 0,
                    "last_turn_index": 0,
                    "last_turn_at": "",
                    "first_user_message": "",
                    "last_user_message": "",
                    "last_assistant_text": "",
                    "_last_epoch": 0.0,
                }
                buckets[session_key] = bucket

            user_message = _extract_user_message_from_prompt(str(data.get("prompt") or ""))
            raw_model_text = str(data.get("response") or "")
            parsed = _parse_chat_model_output(raw_model_text)
            assistant_text = str(parsed.get("assistant_text") or raw_model_text).strip()
            turn_index = _node_turn_index(node)
            turn_time = _node_turn_timestamp(node)
            turn_time_iso = turn_time.isoformat()

            bucket["turn_count"] = int(bucket["turn_count"]) + 1
            if not bucket["first_user_message"] and user_message:
                bucket["first_user_message"] = _truncate_text(user_message, max_chars=240)

            if turn_time.timestamp() >= float(bucket["_last_epoch"]):
                bucket["_last_epoch"] = turn_time.timestamp()
                bucket["last_turn_index"] = turn_index
                bucket["last_turn_at"] = turn_time_iso
                bucket["last_user_message"] = _truncate_text(user_message, max_chars=240)
                bucket["last_assistant_text"] = _truncate_text(assistant_text, max_chars=240)

        threads = []
        for bucket in buckets.values():
            first_user = str(bucket.get("first_user_message") or "").strip()
            title = _truncate_text(first_user, max_chars=80) if first_user else f"Conversation {bucket['session_key']}"
            last_user = str(bucket.get("last_user_message") or "").strip()
            last_assistant = str(bucket.get("last_assistant_text") or "").strip()
            preview_source = last_user or last_assistant or title
            threads.append(
                {
                    "session_key": bucket["session_key"],
                    "title": title,
                    "preview": _truncate_text(preview_source, max_chars=120),
                    "turn_count": int(bucket["turn_count"]),
                    "last_turn_index": int(bucket["last_turn_index"]),
                    "last_turn_at": str(bucket["last_turn_at"]),
                    "first_user_message": first_user,
                    "last_user_message": last_user,
                    "last_assistant_text": last_assistant,
                }
            )

        threads.sort(key=lambda item: str(item.get("last_turn_at") or ""), reverse=True)
        self._send_json(
            HTTPStatus.OK,
            {
                "ok": True,
                "session_id": session_id,
                "threads": threads,
                "count": len(threads),
            },
        )

    def _handle_session_chat_history(self, *, session_id: str, query: dict[str, list[str]]) -> None:
        session_key = (query.get("session_key") or [""])[0].strip()
        if not session_key:
            raise APIError(
                status=HTTPStatus.BAD_REQUEST,
                code="missing_session_key",
                message="Query parameter 'session_key' is required.",
                hint="Call /api/session/{session_id}/chat/history?session_key=your-key.",
            )

        limit = _parse_limit(query)
        turns = self._list_bedrock_turn_nodes(session_id=session_id, session_key=session_key)
        turns.sort(key=lambda node: (_node_turn_index(node), _node_turn_timestamp(node).timestamp()))
        if limit is not None:
            turns = turns[-limit:]

        history_items = []
        for node in turns:
            data = _node_data(node)
            raw_model_text = str(data.get("response") or "")
            parsed = _parse_chat_model_output(raw_model_text)
            history_items.append(
                {
                    "node_id": str(node.get("node_id") or ""),
                    "turn_index": _node_turn_index(node),
                    "ts_utc": str(data.get("ts_utc") or node.get("updated_at") or node.get("created_at") or ""),
                    "model_id": str(data.get("model_id") or ""),
                    "history_turns_used": int(data.get("history_turns_used") or 0),
                    "phase": str(data.get("phase") or ""),
                    "user_message": _extract_user_message_from_prompt(str(data.get("prompt") or "")),
                    "raw_model_text": raw_model_text,
                    "assistant_text": parsed["assistant_text"],
                    "ui": parsed["ui"],
                    "ui_parse_ok": bool(parsed["ui_parse_ok"]),
                    "ui_validate_ok": bool(parsed["ui_validate_ok"]),
                    "ui_rendered": bool(parsed["ui_rendered"]),
                    "ui_rejection_reason": str(parsed["ui_rejection_reason"] or ""),
                }
            )

        self._send_json(
            HTTPStatus.OK,
            {
                "ok": True,
                "session_id": session_id,
                "session_key": session_key,
                "turns": history_items,
                "count": len(history_items),
            },
        )

    def _handle_harness_run(self) -> None:
        payload = self._read_json_body()
        config = _parse_harness_config(payload)
        # TODO: swap in-process execution for a background runner when remote orchestration is wired.
        result = run_bedrock_harness(config)
        self._send_json(HTTPStatus.OK, result)

    def _handle_chat(self) -> None:
        payload = self._read_json_body()
        request = _normalize_chat_request(payload)
        infer_request: dict[str, Any] = {
            "skill": "bedrock_infer",
            "session": request["run_id"],
            "phase": request["phase"],
            "input": {
                "run_id": request["run_id"],
                "session_key": request["session_key"],
                "prompt": _build_chat_prompt(request),
                "system_prompt": request["system_prompt"],
                "max_tokens": request["max_tokens"],
                "max_history_turns": request["max_history_turns"],
                "temperature": request["temperature"],
                "reset_session": request["reset_session"],
            },
        }
        if "model_id" in request:
            infer_request["input"]["model_id"] = request["model_id"]

        try:
            infer_result = aws_tool_handle_request(infer_request)
        except Exception as exc:
            raise APIError(
                status=HTTPStatus.BAD_GATEWAY,
                code="chat_inference_failed",
                message=f"Chat inference failed: {exc}",
                hint="Check AWS credentials/model access and retry, or switch to CEW_MOCK_AWS=1.",
            ) from exc

        output = infer_result.get("output")
        if not isinstance(output, dict):
            raise APIError(
                status=HTTPStatus.INTERNAL_SERVER_ERROR,
                code="chat_inference_output_invalid",
                message="bedrock_infer output was not a JSON object.",
                hint="Inspect bedrock_infer skill output shape.",
            )

        raw_model_text = str(output.get("text") or "")
        parsed = _parse_chat_model_output(raw_model_text)

        response_payload: dict[str, Any] = {
            "ok": True,
            "run_id": request["run_id"],
            "phase": request["phase"],
            "session_key": request["session_key"],
            "assistant_text": parsed["assistant_text"],
            "ui": parsed["ui"],
            "ui_parse_ok": bool(parsed["ui_parse_ok"]),
            "ui_validate_ok": bool(parsed["ui_validate_ok"]),
            "ui_rendered": bool(parsed["ui_rendered"]),
            "ui_rejection_reason": str(parsed["ui_rejection_reason"] or ""),
            "raw_model_text": raw_model_text,
            "model_id": output.get("model_id"),
            "turn_index": output.get("turn_index"),
            "history_turns_used": output.get("history_turns_used"),
            "saved_memory": bool(output.get("saved_memory")),
            "receipt_id": output.get("receipt_id"),
            "provenance": output.get("provenance"),
        }
        self._send_json(HTTPStatus.OK, response_payload)

    def _handle_skill_run(self) -> None:
        payload = self._read_json_body()
        request = _normalize_skill_request(payload)
        # TODO: route this through the external auth/session gateway once localhost-only mode is removed.
        result = aws_tool_handle_request(request)
        self._send_json(HTTPStatus.OK, result)

    def _serve_static(self, route_path: str) -> None:
        if not self.static_root.exists():
            raise APIError(
                status=HTTPStatus.NOT_FOUND,
                code="static_root_missing",
                message=f"Static root not found: {self.static_root}",
                hint="Create docs/workshop/gui (or pass --static-root) before opening the GUI.",
            )

        relative = Path(unquote(route_path.lstrip("/")))
        if route_path in {"", "/"}:
            relative = Path("index.html")

        target = (self.static_root / relative).resolve()
        try:
            target.relative_to(self.static_root)
        except ValueError as exc:
            raise APIError(
                status=HTTPStatus.FORBIDDEN,
                code="invalid_static_path",
                message="Static path traversal is not allowed.",
                hint="Request files under docs/workshop/gui only.",
            ) from exc

        if target.is_dir():
            target = target / "index.html"
        if not target.exists() or not target.is_file():
            spa_index = self.static_root / "index.html"
            if not relative.suffix and spa_index.exists():
                target = spa_index
            else:
                raise APIError(
                    status=HTTPStatus.NOT_FOUND,
                    code="static_file_not_found",
                    message=f"Static file not found for path '{route_path}'.",
                    hint="Verify GUI build artifacts exist under docs/workshop/gui.",
                )

        body = target.read_bytes()
        content_type = mimetypes.guess_type(target.name)[0] or "application/octet-stream"
        self._send_bytes(status=HTTPStatus.OK, body=body, content_type=content_type)


def _resolve_static_root(cli_value: str | None) -> Path:
    if cli_value:
        return Path(cli_value).expanduser().resolve()
    env_value = os.getenv("HARNESS_GUI_STATIC_ROOT", "").strip()
    if env_value:
        return Path(env_value).expanduser().resolve()
    # TODO: switch this default to packaged desktop assets when GUI packaging is finalized.
    return DEFAULT_STATIC_ROOT.resolve()


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run local HTTP bridge for workshop harness GUI.")
    parser.add_argument("--port", type=int, default=int(os.getenv("HARNESS_GUI_PORT", "8765")))
    parser.add_argument("--static-root", default="", help="Override static root (default: docs/workshop/gui).")
    return parser.parse_args()


def main() -> int:
    args = _parse_args()
    if args.port < 1 or args.port > 65535:
        raise SystemExit("Port must be between 1 and 65535.")

    HarnessGUIHandler.static_root = _resolve_static_root(args.static_root)

    with ThreadingHTTPServer((HOST, args.port), HarnessGUIHandler) as httpd:
        print(f"Harness GUI server listening on http://{HOST}:{args.port}")
        print(f"Static root: {HarnessGUIHandler.static_root}")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down harness GUI server.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
