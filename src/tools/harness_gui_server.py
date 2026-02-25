"""Local HTTP server for the workshop harness GUI bridge."""

from __future__ import annotations

import argparse
import json
import mimetypes
import os
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
            if parsed.path == "/api/skill/run":
                self._handle_skill_run()
                return
            raise APIError(
                status=HTTPStatus.NOT_FOUND,
                code="route_not_found",
                message=f"Unknown API route '{parsed.path}'.",
                hint="Use /api/harness/run or /api/skill/run.",
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

        session_id, resource = self._parse_session_route(path)
        if resource == "graph":
            self._handle_session_graph(session_id=session_id, query=query)
            return
        if resource == "memory":
            self._handle_session_memory(session_id=session_id, query=query)
            return

        raise APIError(
            status=HTTPStatus.NOT_FOUND,
            code="route_not_found",
            message=f"Unknown session route '{path}'.",
            hint="Use /api/session/{session_id}/graph or /api/session/{session_id}/memory.",
        )

    def _parse_session_route(self, path: str) -> tuple[str, str]:
        parts = [part for part in path.split("/") if part]
        if len(parts) != 4 or parts[0] != "api" or parts[1] != "session":
            raise APIError(
                status=HTTPStatus.NOT_FOUND,
                code="route_not_found",
                message=f"Unknown API route '{path}'.",
                hint="Use /api/health, /api/session/{session_id}/graph, or /api/session/{session_id}/memory.",
            )
        session_id = unquote(parts[2]).strip()
        if not session_id:
            raise APIError(
                status=HTTPStatus.BAD_REQUEST,
                code="missing_session_id",
                message="Session id is required in the route.",
                hint="Call /api/session/{session_id}/...",
            )
        return session_id, parts[3]

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
                int(_node_data(node).get("turn_index", 0)),
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

    def _handle_harness_run(self) -> None:
        payload = self._read_json_body()
        config = _parse_harness_config(payload)
        # TODO: swap in-process execution for a background runner when remote orchestration is wired.
        result = run_bedrock_harness(config)
        self._send_json(HTTPStatus.OK, result)

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
