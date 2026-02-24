"""Skill allowlist derived from YAML skill definitions."""

from __future__ import annotations

from src.skills.loader import list_skill_names


def get_allowlisted_skills() -> set[str]:
    return set(list_skill_names())
