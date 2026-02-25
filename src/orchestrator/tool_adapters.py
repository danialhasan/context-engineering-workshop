"""Tool adapter registry for the Bedrock harness runtime."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Protocol

from src.aws_tool.dispatcher import execute_skill
from src.skills.loader import load_skill_definitions


class ToolAdapter(Protocol):
    """Adapter interface for one harness-exposed tool."""

    def invoke(self, payload: dict[str, Any]) -> dict[str, Any]:
        """Invoke tool with validated payload."""


@dataclass(frozen=True)
class ToolSpec:
    """Serializable tool descriptor for Bedrock prompt context."""

    name: str
    description: str
    input_schema: dict[str, Any]
    source: str


@dataclass
class AwsToolAdapter:
    """Adapter that routes tool calls through aws_tool dispatcher."""

    skill_name: str
    session_id: str
    phase: str

    def invoke(self, payload: dict[str, Any]) -> dict[str, Any]:
        return execute_skill(
            skill=self.skill_name,
            payload=payload,
            session_id=self.session_id,
            phase=self.phase,
        )


@dataclass
class StubToolAdapter:
    """Stub adapter for future external systems not implemented yet."""

    tool_name: str
    todo: str

    def invoke(self, payload: dict[str, Any]) -> dict[str, Any]:
        # TODO(external-system): Replace this stub with real connectors
        # as each external system is implemented inside this repository.
        return {
            "status": "stub_not_implemented",
            "tool_name": self.tool_name,
            "todo": self.todo,
            "received_input": payload,
        }


_EXTERNAL_STUBS: list[dict[str, Any]] = [
    {
        "name": "external.crm_lookup",
        "description": "Lookup CRM records by email or account id. (stub)",
        "input_schema": {
            "type": "object",
            "required": ["run_id", "query"],
            "properties": {
                "run_id": {"type": "string"},
                "query": {"type": "string"},
            },
        },
        "todo": "TODO(external-system): Implement CRM service in-repo and wire this adapter.",
    },
    {
        "name": "external.ticket_create",
        "description": "Create support/workflow ticket in external tracker. (stub)",
        "input_schema": {
            "type": "object",
            "required": ["run_id", "title"],
            "properties": {
                "run_id": {"type": "string"},
                "title": {"type": "string"},
                "description": {"type": "string"},
                "priority": {"type": "string"},
            },
        },
        "todo": "TODO(external-system): Implement ticketing connector in-repo and wire this adapter.",
    },
    {
        "name": "external.kb_search",
        "description": "Search external knowledge base for supporting context. (stub)",
        "input_schema": {
            "type": "object",
            "required": ["run_id", "query"],
            "properties": {
                "run_id": {"type": "string"},
                "query": {"type": "string"},
                "limit": {"type": "integer"},
            },
        },
        "todo": "TODO(external-system): Implement KB index/search in-repo and wire this adapter.",
    },
]


def build_tool_registry(
    *,
    session_id: str,
    phase: str,
    include_external_stubs: bool = True,
) -> tuple[dict[str, ToolAdapter], list[ToolSpec]]:
    """Build phase-aware tool registry for the harness."""
    definitions = load_skill_definitions()
    registry: dict[str, ToolAdapter] = {}
    specs: list[ToolSpec] = []

    for name in sorted(definitions.keys()):
        if name == "bedrock_infer":
            continue
        skill_def = definitions[name]
        allowed_phases = skill_def.get("allowed_phases") or []
        if phase not in allowed_phases:
            continue
        registry[name] = AwsToolAdapter(skill_name=name, session_id=session_id, phase=phase)
        specs.append(
            ToolSpec(
                name=name,
                description=str(skill_def.get("description") or ""),
                input_schema=dict(skill_def.get("inputs_schema") or {}),
                source="aws_tool",
            )
        )

    if include_external_stubs:
        for stub in _EXTERNAL_STUBS:
            name = str(stub["name"])
            registry[name] = StubToolAdapter(tool_name=name, todo=str(stub["todo"]))
            specs.append(
                ToolSpec(
                    name=name,
                    description=str(stub["description"]),
                    input_schema=dict(stub["input_schema"]),
                    source="stub",
                )
            )

    return registry, specs
