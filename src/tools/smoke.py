"""Real AWS golden-path smoke integration test."""

from __future__ import annotations

import argparse
import json
import os
import sys
import traceback
import uuid
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import boto3

from src.aws_tool.dispatcher import execute_skill
from src.graph.compiler import ContextCompiler
from src.graph.context_graph import GraphStore, MissingTableError


@dataclass
class SmokeFailure(Exception):
    stage: str
    message: str
    session_id: str | None = None


def _fail(stage: str, message: str, session_id: str | None = None) -> None:
    raise SmokeFailure(stage=stage, message=message, session_id=session_id)


def _require_env(name: str, session_id: str | None = None) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        _fail(
            "PRECHECK",
            f"Missing required environment variable '{name}'.",
            session_id=session_id,
        )
    return value


def _require_region(session_id: str) -> str:
    region = os.getenv("AWS_REGION") or os.getenv("AWS_DEFAULT_REGION")
    if not region:
        region = boto3.session.Session().region_name
    if not region:
        _fail(
            "PRECHECK",
            "Missing required AWS region configuration. Set AWS_REGION/AWS_DEFAULT_REGION or configure a default region via `aws configure`.",
            session_id=session_id,
        )
    os.environ.setdefault("AWS_REGION", region)
    return region


def _write_json(path: str, payload: dict[str, Any]) -> None:
    Path(path).write_text(json.dumps(payload, indent=2), encoding="utf-8")


def _sorted_ids(pack: dict[str, Any]) -> list[str]:
    return [str(item.get("id", "")) for item in pack.get("selected_items", [])]


def _contains_type(pack: dict[str, Any], node_type: str) -> bool:
    return any(item.get("type") == node_type for item in pack.get("selected_items", []))


def _count_reason(pack: dict[str, Any], token: str) -> int:
    return sum(
        1
        for item in pack.get("selected_items", [])
        if token in str(item.get("selection_reason", ""))
    )


def run_smoke(task: str, token_budget: int) -> dict[str, Any]:
    session_id = f"smoke-{uuid.uuid4().hex[:10]}"
    print(f"SMOKE session_id={session_id}")

    if os.getenv("CEW_MOCK_AWS", "0") == "1":
        _fail(
            "PRECHECK",
            "CEW_MOCK_AWS=1 is not allowed for real smoke. Unset it or set CEW_MOCK_AWS=0.",
            session_id=session_id,
        )

    _require_region(session_id=session_id)
    _require_env("CEW_ARTIFACT_BUCKET", session_id=session_id)

    graph = GraphStore(mock_mode=False)
    compiler = ContextCompiler(graph_store=graph, mock_mode=False)

    try:
        graph.ensure_tables_exist()
    except MissingTableError as exc:
        _fail("PRECHECK", str(exc), session_id=session_id)

    try:
        # 1) Create new session with Objective + Plan nodes.
        stage = "STEP1_CREATE_OBJECTIVE_PLAN"
        session_node_id = f"session-{session_id}"
        graph.put_node(
            type="Session",
            data={"session_id": session_id},
            session_id=session_id,
            validated=True,
            node_id=session_node_id,
        )
        objective_node_id = graph.put_node(
            type="Objective",
            data={"text": task},
            session_id=session_id,
            validated=True,
        )
        plan_node_id = graph.put_node(
            type="Plan",
            data={"steps": ["Register skills", "Write artifact", "Verify and recompile"], "revision": 1},
            session_id=session_id,
            validated=True,
        )

        # 2) Register at least 2 skills in graph.
        stage = "STEP2_REGISTER_SKILLS"
        skill_upload_id = graph.put_node(
            type="Skill",
            data={"name": "upload_artifact", "allowed_phases": ["ACT", "VERIFY"]},
            session_id=session_id,
            validated=True,
        )
        graph.put_edge(
            from_id=session_node_id,
            edge_type="has_skill",
            to_id=skill_upload_id,
            session_id=session_id,
        )

        skill_receipt_id = graph.put_node(
            type="Skill",
            data={"name": "write_receipt", "allowed_phases": ["ACT", "VERIFY"]},
            session_id=session_id,
            validated=True,
        )
        graph.put_edge(
            from_id=session_node_id,
            edge_type="has_skill",
            to_id=skill_receipt_id,
            session_id=session_id,
        )

        # 3) Run one skill that writes artifact to S3 and logs a receipt.
        stage = "STEP3_RUN_ARTIFACT_SKILL"
        bootstrap_artifact = execute_skill(
            skill="upload_artifact",
            payload={
                "run_id": session_id,
                "name": "bootstrap-evidence.txt",
                "content": "bootstrap evidence for golden path",
            },
            session_id=session_id,
            phase="ACT",
        )
        s3_uri = str(bootstrap_artifact.get("s3_uri", ""))
        if not s3_uri.startswith("s3://"):
            _fail(stage, f"Expected real S3 URI from upload_artifact, got: {s3_uri!r}")

        # 4) Compile context pack (RECITE) before verify evidence.
        stage = "STEP4_COMPILE_BEFORE"
        context_before = compiler.compile_context_pack(
            session_id=session_id,
            task=task,
            strategy="recite",
            phase="VERIFY",
            token_budget=token_budget,
        )
        _write_json("context_pack_before.json", context_before)

        # 5) Mini PLAN -> ACT -> VERIFY loop.
        stage = "STEP5_PLAN_ACT_VERIFY"

        # PLAN writes Task node + Plan update.
        task_node_id = graph.put_node(
            type="Task",
            data={"title": "Mini loop task: verify evidence promotion", "status": "planned"},
            session_id=session_id,
            validated=True,
        )
        plan_update_id = graph.put_node(
            type="Plan",
            data={
                "steps": [
                    "ACT: upload act evidence",
                    "ACT: write phase receipt",
                    "VERIFY: create validated test result",
                ],
                "revision": 2,
            },
            session_id=session_id,
            validated=True,
        )

        # ACT writes Receipt + Artifact.
        act_artifact = execute_skill(
            skill="upload_artifact",
            payload={
                "run_id": session_id,
                "name": "act-evidence.txt",
                "content": "act phase evidence payload",
            },
            session_id=session_id,
            phase="ACT",
        )
        act_receipt = execute_skill(
            skill="write_receipt",
            payload={
                "run_id": session_id,
                "skill_name": "act_phase",
                "status": "success",
                "summary": "ACT wrote artifact evidence",
                "artifact_uri": act_artifact["s3_uri"],
            },
            session_id=session_id,
            phase="ACT",
        )

        # VERIFY produces TestResult evidence and marks validated.
        verification_evidence = {
            "check": "artifact_uri_present",
            "result": "pass",
            "verification": "artifact exists and receipt was written",
            "artifact_uri": act_artifact["s3_uri"],
            "act_receipt_id": act_receipt["receipt_id"],
        }
        verify_artifact = execute_skill(
            skill="upload_artifact",
            payload={
                "run_id": session_id,
                "name": "verify-evidence.json",
                "content": json.dumps(verification_evidence, sort_keys=True),
            },
            session_id=session_id,
            phase="VERIFY",
        )
        verify_receipt = execute_skill(
            skill="write_receipt",
            payload={
                "run_id": session_id,
                "skill_name": "verify_phase",
                "status": "success",
                "summary": "VERIFY produced validation evidence",
                "artifact_uri": verify_artifact["s3_uri"],
            },
            session_id=session_id,
            phase="VERIFY",
        )
        test_result_id = graph.put_node(
            type="TestResult",
            data={
                "status": "pass",
                "check": "artifact_uri_present",
                "verification": "verified with synthetic smoke check",
                "evidence_artifact_uri": verify_artifact["s3_uri"],
            },
            session_id=session_id,
            validated=True,
        )
        graph.put_edge(
            from_id=test_result_id,
            edge_type="verified_by",
            to_id=verify_receipt["receipt_id"],
            session_id=session_id,
        )
        graph.put_edge(
            from_id=test_result_id,
            edge_type="evidence_for",
            to_id=verify_artifact["artifact_id"],
            session_id=session_id,
        )

        # Link task to updated plan so graph traversal has explicit task-related structure.
        graph.put_edge(
            from_id=plan_update_id,
            edge_type="plans_for",
            to_id=task_node_id,
            session_id=session_id,
        )

        # 6) Compile again and assert pack changed due to verification evidence.
        stage = "STEP6_COMPILE_AFTER_AND_ASSERT"
        context_after = compiler.compile_context_pack(
            session_id=session_id,
            task=task,
            strategy="recite",
            phase="VERIFY",
            token_budget=token_budget,
        )
        _write_json("context_pack_after.json", context_after)
        _write_json("context_pack.json", context_after)

        before_ids = _sorted_ids(context_before)
        after_ids = _sorted_ids(context_after)
        if before_ids == after_ids:
            _fail(stage, "Context pack item set did not change after verification evidence was added.")

        if not _contains_type(context_after, "TestResult"):
            _fail(stage, "Post-verify context pack does not include a TestResult item.")

        before_verification_reasons = _count_reason(context_before, "verification evidence window")
        after_verification_reasons = _count_reason(context_after, "verification evidence window")
        if after_verification_reasons <= before_verification_reasons:
            _fail(
                stage,
                "Selection reasons were not updated to reflect verification evidence promotion.",
            )

        before_promoted = _count_reason(context_before, "validated-promoted")
        after_promoted = _count_reason(context_after, "validated-promoted")
        if after_promoted <= before_promoted:
            _fail(
                stage,
                "Validated item promotion did not increase after VERIFY evidence was written.",
            )

        return {
            "ok": True,
            "session_id": session_id,
            "objective_node_id": objective_node_id,
            "plan_node_id": plan_node_id,
            "task_node_id": task_node_id,
            "context_pack_before": "context_pack_before.json",
            "context_pack_after": "context_pack_after.json",
            "context_pack_final": "context_pack.json",
            "before_token_estimate": context_before.get("token_estimate"),
            "after_token_estimate": context_after.get("token_estimate"),
            "before_item_count": len(context_before.get("selected_items", [])),
            "after_item_count": len(context_after.get("selected_items", [])),
        }

    except SmokeFailure:
        raise
    except Exception as exc:  # pragma: no cover - fail loudly for integration visibility
        _fail(stage, f"Unhandled exception: {exc}", session_id=session_id)


def main() -> int:
    parser = argparse.ArgumentParser(description="Run real AWS golden-path smoke integration test.")
    parser.add_argument(
        "--task",
        default="Golden-path smoke: verify context pack promotion after verification evidence",
    )
    parser.add_argument("--token-budget", type=int, default=1400)
    args = parser.parse_args()

    session_id_hint = "unknown"
    try:
        result = run_smoke(task=args.task, token_budget=args.token_budget)
        session_id_hint = str(result.get("session_id", "unknown"))
        print("SMOKE PASS")
        print(json.dumps(result, indent=2))
        return 0
    except SmokeFailure as exc:
        session_id_hint = exc.session_id or session_id_hint
        print("SMOKE FAIL")
        print(f"stage={exc.stage}")
        print(f"error={exc.message}")
        print(f"session_id={session_id_hint}")
        print("traceback=")
        print(traceback.format_exc())
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
