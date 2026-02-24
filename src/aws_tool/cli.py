"""aws_tool CLI with list-skills and run subcommands."""

from __future__ import annotations

import argparse
import json
import sys
from typing import Any

from src.aws_tool.dispatcher import execute_skill
from src.skills.loader import load_skill_definitions


class RequestError(ValueError):
    """Raised when aws_tool request shape is invalid."""


def _error_response(message: str, code: str = "validation_error") -> dict[str, Any]:
    return {"ok": False, "error": {"code": code, "message": message}}


def _parse_json_object(raw: str, field_name: str) -> dict[str, Any]:
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise RequestError(f"Invalid JSON for {field_name}: {exc}") from exc

    if not isinstance(parsed, dict):
        raise RequestError(f"{field_name} must be a JSON object.")
    return parsed


def _parse_request(raw: str) -> dict[str, Any]:
    request = _parse_json_object(raw, "request")

    if "skill" not in request:
        raise RequestError("Missing required field 'skill'.")
    if "input" not in request:
        raise RequestError("Missing required field 'input'.")
    if not isinstance(request["skill"], str):
        raise RequestError("Field 'skill' must be a string.")
    if not isinstance(request["input"], dict):
        raise RequestError("Field 'input' must be a JSON object.")

    return request


def handle_request(request: dict[str, Any]) -> dict[str, Any]:
    skill = request["skill"]
    payload = request["input"]
    session = request.get("session") or payload.get("run_id") or "session-unknown"
    phase = request.get("phase", "ACT")
    output = execute_skill(skill=skill, payload=payload, session_id=session, phase=phase)
    return {
        "ok": True,
        "skill": skill,
        "phase": phase,
        "session": session,
        "output": output,
    }


def _run_list_skills(json_output: bool) -> int:
    skills = load_skill_definitions()
    ordered = [skills[name] for name in sorted(skills.keys())]

    if json_output:
        print(json.dumps({"ok": True, "skills": ordered}, indent=2))
        return 0

    for skill in ordered:
        name = skill.get("name", "<unknown>")
        desc = skill.get("description", "")
        phases = ",".join(skill.get("allowed_phases", []))
        print(f"{name}\t[{phases}]\t{desc}")
    return 0


def _run_skill_command(skill_name: str, payload_json: str, session: str, phase: str) -> int:
    payload = _parse_json_object(payload_json, "--json payload")
    response = handle_request(
        {
            "skill": skill_name,
            "input": payload,
            "session": session,
            "phase": phase,
        }
    )
    print(json.dumps(response, indent=2))
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Allowlisted AWS tool wrapper.")
    sub = parser.add_subparsers(dest="command")

    list_parser = sub.add_parser("list-skills", help="List available allowlisted skills")
    list_parser.add_argument("--json-output", action="store_true", help="Print full JSON definitions")

    run_parser = sub.add_parser("run", help="Run one skill with JSON payload")
    run_parser.add_argument("skill_name", help="Skill name")
    run_parser.add_argument("--json", required=True, dest="payload_json", help="JSON payload object")
    run_parser.add_argument("--session", required=True, help="Session id")
    run_parser.add_argument("--phase", required=True, choices=["PLAN", "ACT", "VERIFY"], help="Execution phase")

    # Backward-compatible mode used by existing tests/orchestrator.
    parser.add_argument("--input", help="Legacy JSON request string. If omitted, stdin is read.")
    parser.add_argument("--pretty", action="store_true", help="Pretty-print legacy mode output.")

    args = parser.parse_args()

    try:
        if args.command == "list-skills":
            return _run_list_skills(json_output=args.json_output)

        if args.command == "run":
            return _run_skill_command(
                skill_name=args.skill_name,
                payload_json=args.payload_json,
                session=args.session,
                phase=args.phase,
            )

        # Legacy request mode (kept for handle_request compatibility and quick piping).
        raw_input = args.input if args.input is not None else sys.stdin.read()
        if not raw_input.strip():
            response = _error_response("No command provided. Use 'list-skills' or 'run'.", code="empty_input")
            print(json.dumps(response, indent=2 if args.pretty else None))
            return 1

        request = _parse_request(raw_input)
        response = handle_request(request)
        print(json.dumps(response, indent=2 if args.pretty else None))
        return 0
    except RequestError as exc:
        response = _error_response(str(exc), code="request_error")
        print(json.dumps(response, indent=2 if args.pretty else None))
        return 1
    except Exception as exc:
        response = _error_response(str(exc), code="execution_error")
        print(json.dumps(response, indent=2 if args.pretty else None))
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
