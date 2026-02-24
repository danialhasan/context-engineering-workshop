"""Fallback summarizer when Bedrock is unavailable."""

from __future__ import annotations


def summarize(text: str, max_chars: int = 800) -> str:
    cleaned = " ".join(text.split())
    if len(cleaned) <= max_chars:
        return cleaned
    return cleaned[: max_chars - 3] + "..."
