"""Bedrock-first harness loop with tool adapters and persisted memory."""

from __future__ import annotations

import json
import re
from dataclasses import dataclass
from typing import Any

from src.aws_tool.dispatcher import execute_skill
from src.orchestrator.tool_adapters import ToolAdapter, ToolSpec, build_tool_registry


DEFAULT_SYSTEM_PROMPT = (
    "You are the Bedrock harness controller. Think step-by-step internally, "
    "but output only valid JSON that follows the required action schema."
)


@dataclass
class BedrockHarnessConfig:
    """Runtime configuration for one Bedrock harness session."""

    run_id: str
    phase: str
    goal: str
    session_key: str = "harness-main"
    model_id: str | None = None
    system_prompt: str = DEFAULT_SYSTEM_PROMPT
    max_steps: int = 6
    max_history_turns: int = 8
    max_tokens: int = 400
    temperature: float = 0.0
    include_external_stubs: bool = True


def _trim_for_prompt(value: Any, max_chars: int = 1200) -> str:
    text = json.dumps(value, sort_keys=True, default=str)
    if len(text) <= max_chars:
        return text
    return text[: max_chars - 3] + "..."


def _extract_json_object(text: str) -> dict[str, Any] | None:
    stripped = text.strip()
    fence_match = re.search(r"```(?:json)?\s*(\{.*\})\s*```", stripped, re.DOTALL)
    if fence_match:
        stripped = fence_match.group(1).strip()

    try:
        parsed = json.loads(stripped)
        if isinstance(parsed, dict):
            return parsed
    except json.JSONDecodeError:
        pass

    first = stripped.find("{")
    last = stripped.rfind("}")
    if first == -1 or last == -1 or first >= last:
        return None
    try:
        parsed = json.loads(stripped[first : last + 1])
        if isinstance(parsed, dict):
            return parsed
    except json.JSONDecodeError:
        return None
    return None


def _parse_model_action(text: str) -> dict[str, Any]:
    parsed = _extract_json_object(text)
    if not isinstance(parsed, dict):
        return {
            "action": "respond",
            "response": text.strip(),
            "reason": "model_output_not_json",
        }

    action = str(parsed.get("action") or "respond").strip().lower()
    reason = str(parsed.get("reason") or "")
    if action == "tool_call":
        tool_name = str(parsed.get("tool_name") or "").strip()
        tool_input = parsed.get("tool_input")
        if not tool_name or not isinstance(tool_input, dict):
            return {
                "action": "respond",
                "response": text.strip(),
                "reason": "invalid_tool_call_shape",
            }
        return {
            "action": "tool_call",
            "tool_name": tool_name,
            "tool_input": tool_input,
            "reason": reason,
        }

    return {
        "action": "respond",
        "response": str(parsed.get("response") or text.strip()),
        "reason": reason,
    }


def _build_step_prompt(
    *,
    config: BedrockHarnessConfig,
    tool_specs: list[ToolSpec],
    step: int,
    tool_events: list[dict[str, Any]],
) -> str:
    recent_events = tool_events[-3:]
    tools_brief = [
        {
            "name": spec.name,
            "source": spec.source,
            "description": spec.description,
            "required_inputs": list((spec.input_schema.get("required") or [])),
        }
        for spec in tool_specs
    ]

    return (
        "Goal:\n"
        f"{config.goal}\n\n"
        "Current phase:\n"
        f"{config.phase}\n\n"
        "Iteration:\n"
        f"{step}/{config.max_steps}\n\n"
        "Available tools (JSON):\n"
        f"{_trim_for_prompt(tools_brief)}\n\n"
        "Recent tool events (JSON):\n"
        f"{_trim_for_prompt(recent_events)}\n\n"
        "Response contract:\n"
        "Return ONLY one JSON object with one of these shapes.\n"
        '{"action":"tool_call","tool_name":"<tool>","tool_input":{...},"reason":"<why>"}\n'
        '{"action":"respond","response":"<final answer>","reason":"<why done>"}\n\n'
        "Rules:\n"
        "- Call at most one tool this turn.\n"
        "- If tool_call, include required fields from that tool schema.\n"
        "- Do not call bedrock_infer.\n"
        "- If a required system is unavailable, call an external.* stub and continue.\n"
    )


def _invoke_tool(
    *,
    registry: dict[str, ToolAdapter],
    run_id: str,
    tool_name: str,
    tool_input: dict[str, Any],
) -> dict[str, Any]:
    adapter = registry.get(tool_name)
    if adapter is None:
        return {
            "ok": False,
            "error": f"Unknown tool '{tool_name}'.",
            "tool_name": tool_name,
        }

    payload = dict(tool_input)
    payload.setdefault("run_id", run_id)
    try:
        output = adapter.invoke(payload)
        return {
            "ok": True,
            "tool_name": tool_name,
            "input": payload,
            "output": output,
        }
    except Exception as exc:
        return {
            "ok": False,
            "tool_name": tool_name,
            "input": payload,
            "error": str(exc),
        }


def run_bedrock_harness(config: BedrockHarnessConfig) -> dict[str, Any]:
    """Run Bedrock controller loop until response or step budget exhaustion."""
    if config.max_steps <= 0:
        raise ValueError("max_steps must be >= 1")

    registry, tool_specs = build_tool_registry(
        session_id=config.run_id,
        phase=config.phase,
        include_external_stubs=config.include_external_stubs,
    )
    events: list[dict[str, Any]] = []
    turns: list[dict[str, Any]] = []

    for step in range(1, config.max_steps + 1):
        prompt = _build_step_prompt(
            config=config,
            tool_specs=tool_specs,
            step=step,
            tool_events=events,
        )
        infer_payload: dict[str, Any] = {
            "run_id": config.run_id,
            "session_key": config.session_key,
            "prompt": prompt,
            "system_prompt": config.system_prompt,
            "max_history_turns": config.max_history_turns,
            "max_tokens": config.max_tokens,
            "temperature": config.temperature,
        }
        if config.model_id:
            infer_payload["model_id"] = config.model_id

        infer_output = execute_skill(
            skill="bedrock_infer",
            payload=infer_payload,
            session_id=config.run_id,
            phase=config.phase,
        )
        model_text = str(infer_output.get("text") or "")
        action = _parse_model_action(model_text)

        turn: dict[str, Any] = {
            "step": step,
            "model_id": infer_output.get("model_id"),
            "history_turns_used": infer_output.get("history_turns_used"),
            "action": action,
        }

        if action["action"] == "respond":
            turn["status"] = "done"
            turns.append(turn)
            return {
                "ok": True,
                "run_id": config.run_id,
                "phase": config.phase,
                "session_key": config.session_key,
                "steps_executed": step,
                "final_response": action.get("response", ""),
                "turns": turns,
                "tool_events": events,
            }

        tool_name = str(action["tool_name"])
        tool_input = dict(action["tool_input"])
        tool_event = _invoke_tool(
            registry=registry,
            run_id=config.run_id,
            tool_name=tool_name,
            tool_input=tool_input,
        )
        events.append(tool_event)
        turn["tool_event"] = tool_event
        turns.append(turn)

    return {
        "ok": False,
        "run_id": config.run_id,
        "phase": config.phase,
        "session_key": config.session_key,
        "steps_executed": config.max_steps,
        "error": "max_steps_reached_without_final_response",
        "turns": turns,
        "tool_events": events,
    }
