"""Minimal PLAN -> ACT -> VERIFY orchestrator loop for smoke tests."""

from __future__ import annotations

import argparse
import json
import uuid
from pathlib import Path
from typing import Any

from src.aws_tool.cli import handle_request


def _run_skill(skill: str, payload: dict[str, Any], phase: str) -> dict[str, Any]:
    response = handle_request({"skill": skill, "input": payload, "phase": phase})
    return response["output"]


def run_smoke() -> dict[str, Any]:
    run_id = f"run-{uuid.uuid4().hex[:10]}"

    plan = {
        "run_id": run_id,
        "steps": [
            "resolve_identity",
            "upsert_node",
            "link_edge",
            "upload_artifact",
            "write_receipt",
            "compile_context_pack",
            "summarize_evidence",
        ],
    }

    identity = _run_skill("resolve_identity", {"run_id": run_id}, phase="PLAN")

    _run_skill(
        "upsert_node",
        {
            "run_id": run_id,
            "node_type": "Run",
            "node_id": run_id,
            "payload": {"state": "active", "owner": identity["user_id"]},
        },
        phase="ACT",
    )

    step_id = f"step-{uuid.uuid4().hex[:6]}"
    _run_skill(
        "upsert_node",
        {
            "run_id": run_id,
            "node_type": "SkillExecution",
            "node_id": step_id,
            "payload": {"skill": "upload_artifact", "status": "success"},
        },
        phase="ACT",
    )

    _run_skill(
        "link_edge",
        {
            "run_id": run_id,
            "from_id": run_id,
            "to_id": step_id,
            "edge_type": "RUN_HAS_STEP",
        },
        phase="ACT",
    )

    artifact = _run_skill(
        "upload_artifact",
        {
            "run_id": run_id,
            "name": "smoke.log",
            "content": "Smoke run executed PLAN -> ACT -> VERIFY.",
        },
        phase="ACT",
    )

    _run_skill(
        "write_receipt",
        {
            "run_id": run_id,
            "skill_name": "orchestrator",
            "status": "success",
            "summary": "Completed ACT phase.",
            "artifact_uri": artifact["s3_uri"],
        },
        phase="VERIFY",
    )

    pack = _run_skill(
        "compile_context_pack",
        {
            "run_id": run_id,
            "max_items": 10,
            "byte_budget": 4096,
        },
        phase="VERIFY",
    )

    summary = _run_skill(
        "summarize_evidence",
        {
            "run_id": run_id,
            "evidence_refs": [artifact["s3_uri"]],
            "max_chars": 400,
        },
        phase="VERIFY",
    )

    verified = bool(pack.get("items")) and bool(summary.get("summary"))
    if not verified:
        raise RuntimeError("Smoke verification failed: missing context pack items or summary.")

    result = {
        "ok": True,
        "phase": "VERIFY",
        "run_id": run_id,
        "plan": plan,
        "artifact": artifact,
        "pack": {
            "pack_id": pack["pack_id"],
            "item_count": len(pack.get("items", [])),
            "used_bytes": pack["used_bytes"],
        },
        "summary": {
            "provider": summary["provider"],
            "text": summary["summary"],
        },
    }

    Path("logs").mkdir(parents=True, exist_ok=True)
    Path("logs/smoke-last.json").write_text(json.dumps(result, indent=2), encoding="utf-8")
    return result


def main() -> int:
    parser = argparse.ArgumentParser(description="Run the workshop orchestrator loop.")
    parser.add_argument("--smoke", action="store_true", help="Run the smoke flow")
    args = parser.parse_args()

    if args.smoke:
        result = run_smoke()
        print(json.dumps(result, indent=2))
        return 0

    print("No action requested. Use --smoke.")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
