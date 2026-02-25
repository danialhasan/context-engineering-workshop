"""Context engineering workshop source package."""

from __future__ import annotations

from pathlib import Path

try:
    from dotenv import load_dotenv
except Exception:  # pragma: no cover - optional until deps are installed
    load_dotenv = None

if load_dotenv is not None:
    # Load repo-local .env for workshop ergonomics (does not override shell exports).
    load_dotenv(dotenv_path=Path(__file__).resolve().parents[1] / ".env", override=False)
