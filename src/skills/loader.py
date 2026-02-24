"""Load skill definition YAML files from the repository skill graph."""

from __future__ import annotations

from pathlib import Path
from typing import Any

import yaml


class SkillDefinitionError(RuntimeError):
    """Raised when skill definitions are missing or malformed."""


_SKILL_CACHE: dict[str, dict[str, Any]] | None = None


def _skills_dir() -> Path:
    return Path(__file__).resolve().parents[2] / "skills"


def load_skill_definitions(force_reload: bool = False) -> dict[str, dict[str, Any]]:
    global _SKILL_CACHE
    if _SKILL_CACHE is not None and not force_reload:
        return _SKILL_CACHE

    skills_path = _skills_dir()
    if not skills_path.exists():
        raise SkillDefinitionError(f"Skills directory not found: {skills_path}")

    definitions: dict[str, dict[str, Any]] = {}
    for file_path in sorted(skills_path.glob("*.yml")):
        raw = yaml.safe_load(file_path.read_text(encoding="utf-8"))
        if not isinstance(raw, dict):
            raise SkillDefinitionError(f"Skill file {file_path} must contain a YAML object.")

        name = raw.get("name")
        if not isinstance(name, str) or not name.strip():
            raise SkillDefinitionError(f"Skill file {file_path} is missing a valid 'name'.")

        if name in definitions:
            raise SkillDefinitionError(f"Duplicate skill name '{name}' in {file_path}.")

        definitions[name] = raw

    if not definitions:
        raise SkillDefinitionError(f"No skill definitions found in {skills_path}")

    _SKILL_CACHE = definitions
    return definitions


def list_skill_names() -> list[str]:
    return sorted(load_skill_definitions().keys())


def get_skill_definition(name: str) -> dict[str, Any]:
    skills = load_skill_definitions()
    if name not in skills:
        available = ", ".join(sorted(skills.keys()))
        raise SkillDefinitionError(f"Unknown skill '{name}'. Available: {available}")
    return skills[name]
