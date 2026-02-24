"""Schema and phase validation helpers for skill definitions."""

from __future__ import annotations

from typing import Any


class SkillValidationError(ValueError):
    """Raised when skill execution inputs/outputs are invalid."""


def _type_name_to_python(type_name: str) -> type:
    mapping = {
        "string": str,
        "integer": int,
        "number": (int, float),
        "boolean": bool,
        "object": dict,
        "array": list,
    }
    if type_name not in mapping:
        raise SkillValidationError(f"Unsupported schema type '{type_name}'.")
    return mapping[type_name]  # type: ignore[return-value]


def _validate_value(schema: dict[str, Any], value: Any, field: str) -> None:
    schema_type = schema.get("type")
    if schema_type:
        py_type = _type_name_to_python(str(schema_type))
        if not isinstance(value, py_type):
            raise SkillValidationError(f"Field '{field}' must be type '{schema_type}'.")

    if "enum" in schema and value not in schema["enum"]:
        allowed = ", ".join(str(v) for v in schema["enum"])
        raise SkillValidationError(f"Field '{field}' must be one of: {allowed}.")

    if isinstance(value, (int, float)):
        if "minimum" in schema and value < schema["minimum"]:
            raise SkillValidationError(f"Field '{field}' must be >= {schema['minimum']}.")
        if "maximum" in schema and value > schema["maximum"]:
            raise SkillValidationError(f"Field '{field}' must be <= {schema['maximum']}.")

    if isinstance(value, list) and "items" in schema:
        item_schema = schema["items"]
        if not isinstance(item_schema, dict):
            raise SkillValidationError(f"Schema for '{field}.items' must be an object.")
        for idx, item in enumerate(value):
            _validate_value(item_schema, item, f"{field}[{idx}]")


def validate_payload_against_schema(schema: dict[str, Any], payload: dict[str, Any], skill_name: str) -> None:
    if not isinstance(payload, dict):
        raise SkillValidationError(f"Payload for '{skill_name}' must be a JSON object.")

    if schema.get("type") not in {None, "object"}:
        raise SkillValidationError(f"Top-level inputs schema for '{skill_name}' must be type 'object'.")

    required = schema.get("required", [])
    properties = schema.get("properties", {})

    if not isinstance(required, list) or not all(isinstance(x, str) for x in required):
        raise SkillValidationError(f"Invalid required list in schema for '{skill_name}'.")
    if not isinstance(properties, dict):
        raise SkillValidationError(f"Invalid properties object in schema for '{skill_name}'.")

    for field in required:
        if field not in payload:
            raise SkillValidationError(f"Missing required field '{field}' for '{skill_name}'.")

    unknown = set(payload.keys()) - set(properties.keys())
    if unknown:
        names = ", ".join(sorted(unknown))
        raise SkillValidationError(f"Unknown field(s) for '{skill_name}': {names}.")

    for field, value in payload.items():
        field_schema = properties.get(field)
        if not isinstance(field_schema, dict):
            raise SkillValidationError(f"Schema for field '{field}' in '{skill_name}' must be an object.")
        _validate_value(field_schema, value, field)


def validate_phase(skill_def: dict[str, Any], phase: str) -> None:
    allowed = skill_def.get("allowed_phases", [])
    if not isinstance(allowed, list) or not all(isinstance(x, str) for x in allowed):
        raise SkillValidationError(f"Skill '{skill_def.get('name', '<unknown>')}' has invalid allowed_phases.")

    if phase not in allowed:
        allowed_text = ", ".join(allowed)
        raise SkillValidationError(
            f"Skill '{skill_def.get('name', '<unknown>')}' is not allowed in phase '{phase}'. "
            f"Allowed phases: {allowed_text}."
        )


def validate_output_against_schema(schema: dict[str, Any], output: dict[str, Any], skill_name: str) -> None:
    if not isinstance(output, dict):
        raise SkillValidationError(f"Output for '{skill_name}' must be a JSON object.")

    if schema.get("type") not in {None, "object"}:
        raise SkillValidationError(f"Top-level output schema for '{skill_name}' must be type 'object'.")

    required = schema.get("required", [])
    properties = schema.get("properties", {})

    for field in required:
        if field not in output:
            raise SkillValidationError(f"Output for '{skill_name}' missing required field '{field}'.")

    for field, value in output.items():
        field_schema = properties.get(field)
        if isinstance(field_schema, dict):
            _validate_value(field_schema, value, field)
