"""Workshop scenario runner for guided single-agent and swarm demonstrations."""

from __future__ import annotations

import argparse
import json
import os
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Callable

from src.aws_tool.cli import handle_request


ScenarioFunc = Callable[[str], dict[str, Any]]


def _now_utc() -> str:
    return datetime.now(timezone.utc).isoformat()


def _utc_in(seconds: int) -> str:
    return (datetime.now(timezone.utc) + timedelta(seconds=seconds)).isoformat()


def _utc_before(seconds: int) -> str:
    return (datetime.now(timezone.utc) - timedelta(seconds=seconds)).isoformat()


def _run_skill(*, session: str, phase: str, skill: str, payload: dict[str, Any]) -> dict[str, Any]:
    response = handle_request(
        {
            "skill": skill,
            "input": payload,
            "session": session,
            "phase": phase,
        }
    )
    output = response.get("output")
    if not isinstance(output, dict):
        raise RuntimeError(f"{skill} returned non-object output.")
    return output


def _resolve_artifact_bucket() -> str:
    bucket = str(os.getenv("CEW_ARTIFACT_BUCKET") or "").strip()
    if bucket:
        return bucket

    identity = _run_skill(
        session=f"bucket-resolve-{int(time.time())}",
        phase="PLAN",
        skill="resolve_identity",
        payload={"run_id": f"bucket-resolve-{int(time.time())}"},
    )
    account = str(identity.get("account_id") or "000000000000")
    region = str(os.getenv("AWS_REGION") or os.getenv("AWS_DEFAULT_REGION") or "us-west-2")
    return f"cew-artifacts-{account}-{region}"


def scenario_a_happy_path(run_id: str) -> dict[str, Any]:
    task = _run_skill(
        session=run_id,
        phase="PLAN",
        skill="create_task",
        payload={
            "run_id": run_id,
            "title": "Scenario A: happy path single-agent lifecycle",
            "description": "Create -> claim -> complete -> verify -> promote",
        },
    )
    task_id = str(task["task_id"])

    claim = _run_skill(
        session=run_id,
        phase="ACT",
        skill="claim_task",
        payload={
            "run_id": run_id,
            "task_id": task_id,
            "agent_id": "worker-a",
            "lease_seconds": 900,
        },
    )

    artifact = _run_skill(
        session=run_id,
        phase="ACT",
        skill="upload_artifact",
        payload={
            "run_id": run_id,
            "name": "scenario-a-evidence.txt",
            "content": "Scenario A evidence: verified promotion path.",
        },
    )
    artifact_uri = str(artifact["s3_uri"])

    complete = _run_skill(
        session=run_id,
        phase="ACT",
        skill="complete_task",
        payload={
            "run_id": run_id,
            "task_id": task_id,
            "agent_id": "worker-a",
            "summary": "Uploaded evidence for happy path.",
            "artifact_uri": artifact_uri,
            "status": "success",
        },
    )

    verify = _run_skill(
        session=run_id,
        phase="VERIFY",
        skill="verify_task",
        payload={
            "run_id": run_id,
            "task_id": task_id,
            "check_type": "s3_head_object",
            "artifact_uri": artifact_uri,
            "notes": "Scenario A verification",
        },
    )

    tasks = _run_skill(
        session=run_id,
        phase="VERIFY",
        skill="list_tasks",
        payload={"run_id": run_id, "limit": 20},
    )
    task_rows = tasks.get("tasks", [])
    promoted = next((row for row in task_rows if row.get("task_id") == task_id), {})

    return {
        "scenario": "A",
        "run_id": run_id,
        "ok": verify.get("status") == "pass" and str(promoted.get("state")) == "done",
        "steps": {
            "create_task": task,
            "claim_task": claim,
            "upload_artifact": artifact,
            "complete_task": complete,
            "verify_task": verify,
        },
        "expected_observations": [
            "Task transitions open -> claimed -> completed -> done",
            "Verification gate opens only after evidence check passes",
            "Receipt and artifact linkage visible in graph",
        ],
        "summary": {
            "task_id": task_id,
            "artifact_uri": artifact_uri,
            "verification_status": verify.get("status"),
            "task_state": promoted.get("state"),
            "lease_expires_at": claim.get("lease_expires_at"),
        },
    }


def scenario_b_no_evidence_attempt(run_id: str) -> dict[str, Any]:
    bucket = _resolve_artifact_bucket()
    missing_uri = f"s3://{bucket}/workshop-artifacts/{run_id}/missing-evidence-{int(time.time())}.txt"

    task = _run_skill(
        session=run_id,
        phase="PLAN",
        skill="create_task",
        payload={
            "run_id": run_id,
            "title": "Scenario B: no-evidence attempt should be blocked",
            "description": "Complete without usable evidence and verify should fail",
        },
    )
    task_id = str(task["task_id"])

    _run_skill(
        session=run_id,
        phase="ACT",
        skill="claim_task",
        payload={
            "run_id": run_id,
            "task_id": task_id,
            "agent_id": "worker-b",
            "lease_seconds": 600,
        },
    )

    complete = _run_skill(
        session=run_id,
        phase="ACT",
        skill="complete_task",
        payload={
            "run_id": run_id,
            "task_id": task_id,
            "agent_id": "worker-b",
            "summary": "Attempted completion without uploaded evidence.",
            "status": "success",
        },
    )

    verify = _run_skill(
        session=run_id,
        phase="VERIFY",
        skill="verify_task",
        payload={
            "run_id": run_id,
            "task_id": task_id,
            "check_type": "s3_head_object",
            "artifact_uri": missing_uri,
            "notes": "Expected to fail for workshop scenario B",
        },
    )

    tasks = _run_skill(
        session=run_id,
        phase="VERIFY",
        skill="list_tasks",
        payload={"run_id": run_id, "limit": 20},
    )
    task_rows = tasks.get("tasks", [])
    task_state = next((row.get("state") for row in task_rows if row.get("task_id") == task_id), "")

    return {
        "scenario": "B",
        "run_id": run_id,
        "ok": verify.get("status") == "fail" and str(task_state) == "blocked",
        "steps": {
            "create_task": task,
            "complete_task": complete,
            "verify_task": verify,
        },
        "expected_observations": [
            "Promotion blocked with explicit failure details",
            "Task transitions to blocked state",
            "Verification gate reason visible in UI",
        ],
        "summary": {
            "task_id": task_id,
            "missing_artifact_uri": missing_uri,
            "verification_status": verify.get("status"),
            "task_state": task_state,
        },
    }


def scenario_c_parallel_conflict(run_id: str) -> dict[str, Any]:
    task = _run_skill(
        session=run_id,
        phase="PLAN",
        skill="create_task",
        payload={
            "run_id": run_id,
            "title": "Scenario C: parallel claims conflict",
            "description": "Two workers claim same task, verifier resolves by promoted completion",
        },
    )
    task_id = str(task["task_id"])

    claim_a = _run_skill(
        session=run_id,
        phase="ACT",
        skill="claim_task",
        payload={
            "run_id": run_id,
            "task_id": task_id,
            "agent_id": "worker-c1",
            "lease_seconds": 900,
        },
    )
    claim_b = _run_skill(
        session=run_id,
        phase="ACT",
        skill="claim_task",
        payload={
            "run_id": run_id,
            "task_id": task_id,
            "agent_id": "worker-c2",
            "lease_seconds": 900,
        },
    )

    artifact = _run_skill(
        session=run_id,
        phase="ACT",
        skill="upload_artifact",
        payload={
            "run_id": run_id,
            "name": "scenario-c-worker-c2.txt",
            "content": "worker-c2 completion artifact",
        },
    )

    _run_skill(
        session=run_id,
        phase="ACT",
        skill="complete_task",
        payload={
            "run_id": run_id,
            "task_id": task_id,
            "agent_id": "worker-c2",
            "summary": "worker-c2 completion selected for verification.",
            "artifact_uri": artifact["s3_uri"],
            "status": "success",
        },
    )

    verify = _run_skill(
        session=run_id,
        phase="VERIFY",
        skill="verify_task",
        payload={
            "run_id": run_id,
            "task_id": task_id,
            "check_type": "s3_head_object",
            "artifact_uri": artifact["s3_uri"],
            "notes": "Scenario C verifier selected worker-c2 evidence",
        },
    )

    tasks = _run_skill(
        session=run_id,
        phase="VERIFY",
        skill="list_tasks",
        payload={"run_id": run_id, "limit": 20},
    )
    promoted = next((row for row in tasks.get("tasks", []) if row.get("task_id") == task_id), {})

    return {
        "scenario": "C",
        "run_id": run_id,
        "ok": verify.get("status") == "pass",
        "steps": {
            "claim_worker_1": claim_a,
            "claim_worker_2": claim_b,
            "verify_task": verify,
        },
        "expected_observations": [
            "Multiple claims exist for same task (conflict)",
            "Resolution policy favors latest verified completion",
            "Conflict and resolution visible in freshness/conflict panel",
        ],
        "summary": {
            "task_id": task_id,
            "claim_ids": [claim_a.get("claim_id"), claim_b.get("claim_id")],
            "resolved_state": promoted.get("state"),
            "resolved_assignee": promoted.get("assigned_to"),
        },
    }


def scenario_d_timeout_reassign(run_id: str) -> dict[str, Any]:
    task = _run_skill(
        session=run_id,
        phase="PLAN",
        skill="create_task",
        payload={
            "run_id": run_id,
            "title": "Scenario D: lease timeout and reassign",
            "description": "First claim expires, second worker reclaims task",
        },
    )
    task_id = str(task["task_id"])

    claim_1 = _run_skill(
        session=run_id,
        phase="ACT",
        skill="claim_task",
        payload={
            "run_id": run_id,
            "task_id": task_id,
            "agent_id": "worker-d1",
            "lease_seconds": 1,
        },
    )
    time.sleep(2)

    claim_2 = _run_skill(
        session=run_id,
        phase="ACT",
        skill="claim_task",
        payload={
            "run_id": run_id,
            "task_id": task_id,
            "agent_id": "worker-d2",
            "claim_state": "reassigned",
            "lease_seconds": 900,
        },
    )

    _run_skill(
        session=run_id,
        phase="ACT",
        skill="complete_task",
        payload={
            "run_id": run_id,
            "task_id": task_id,
            "agent_id": "worker-d2",
            "summary": "Reassigned worker completed task after timeout.",
            "status": "success",
        },
    )

    verify = _run_skill(
        session=run_id,
        phase="VERIFY",
        skill="verify_task",
        payload={
            "run_id": run_id,
            "task_id": task_id,
            "check_type": "noop",
            "notes": "Scenario D uses noop to keep focus on lease timeout + reassign path",
        },
    )

    return {
        "scenario": "D",
        "run_id": run_id,
        "ok": verify.get("status") == "pass",
        "steps": {
            "initial_claim": claim_1,
            "reassign_claim": claim_2,
            "verify_task": verify,
        },
        "expected_observations": [
            "First claim lease_expires_at is in the past by reassign time",
            "Second claim marks reassignment path",
            "Coordination panel shows timeout/reassign event",
        ],
        "summary": {
            "task_id": task_id,
            "initial_lease_expires_at": claim_1.get("lease_expires_at"),
            "reassign_lease_expires_at": claim_2.get("lease_expires_at"),
            "verification_status": verify.get("status"),
        },
    }


def scenario_e_stale_context(run_id: str) -> dict[str, Any]:
    stale_node_id = f"decision-stale-{int(time.time())}"
    fresh_node_id = f"decision-fresh-{int(time.time())}"

    _run_skill(
        session=run_id,
        phase="ACT",
        skill="upsert_node",
        payload={
            "run_id": run_id,
            "node_type": "Decision",
            "node_id": stale_node_id,
            "payload": {
                "summary": "Context preference v1 (stale)",
                "topic": "retrieval-policy",
                "trust_level": "unverified",
                "version": 1,
                "fresh_until": _utc_before(1800),
                "ts_utc": _utc_before(2400),
            },
        },
    )

    _run_skill(
        session=run_id,
        phase="ACT",
        skill="upsert_node",
        payload={
            "run_id": run_id,
            "node_type": "Decision",
            "node_id": fresh_node_id,
            "payload": {
                "summary": "Context preference v2 (fresh + trusted)",
                "topic": "retrieval-policy",
                "trust_level": "verified",
                "version": 2,
                "supersedes": stale_node_id,
                "fresh_until": _utc_in(1800),
                "ts_utc": _now_utc(),
            },
        },
    )

    search = _run_skill(
        session=run_id,
        phase="PLAN",
        skill="search_nodes",
        payload={
            "run_id": run_id,
            "query": "retrieval-policy context preference",
            "types": ["Decision"],
            "limit": 10,
        },
    )
    matches = search.get("matches", [])
    first_match_id = matches[0].get("node_id") if matches else ""
    match_ids = [str(item.get("node_id") or "") for item in matches]
    has_stale = stale_node_id in match_ids
    has_fresh = fresh_node_id in match_ids

    return {
        "scenario": "E",
        "run_id": run_id,
        "ok": first_match_id == fresh_node_id and has_stale and has_fresh,
        "steps": {
            "search_nodes": search,
        },
        "expected_observations": [
            "Stale node and fresh superseding node both visible",
            "Freshness/conflict resolver prioritizes latest trusted node",
            "Supersession lineage visible via metadata",
        ],
        "summary": {
            "stale_node_id": stale_node_id,
            "fresh_node_id": fresh_node_id,
            "first_match_id": first_match_id,
            "match_count": len(matches),
            "has_stale_match": has_stale,
            "has_fresh_match": has_fresh,
        },
    }


SCENARIOS: dict[str, ScenarioFunc] = {
    "A": scenario_a_happy_path,
    "B": scenario_b_no_evidence_attempt,
    "C": scenario_c_parallel_conflict,
    "D": scenario_d_timeout_reassign,
    "E": scenario_e_stale_context,
}


def run_scenarios(*, session_base: str, scenario: str) -> dict[str, Any]:
    scenario_key = scenario.upper()
    if scenario_key == "ALL":
        ordered = ["A", "B", "C", "D", "E"]
    else:
        if scenario_key not in SCENARIOS:
            raise ValueError(f"Unsupported scenario '{scenario}'. Use A, B, C, D, E, or ALL.")
        ordered = [scenario_key]

    runs: list[dict[str, Any]] = []
    for key in ordered:
        run_id = f"{session_base}-{key.lower()}"
        result = SCENARIOS[key](run_id)
        runs.append(result)

    ok = all(bool(item.get("ok")) for item in runs)
    output = {
        "ok": ok,
        "session_base": session_base,
        "scenario": scenario_key,
        "runs": runs,
        "completed_at": _now_utc(),
    }
    Path("logs").mkdir(parents=True, exist_ok=True)
    Path("logs/workshop-scenarios-last.json").write_text(json.dumps(output, indent=2), encoding="utf-8")
    return output


def main() -> int:
    parser = argparse.ArgumentParser(description="Run workshop scenario suite (A-E).")
    parser.add_argument("--session-base", required=True, help="Base session id prefix for scenario runs.")
    parser.add_argument(
        "--scenario",
        default="ALL",
        help="Scenario to run: A, B, C, D, E, or ALL (default).",
    )
    args = parser.parse_args()

    result = run_scenarios(session_base=args.session_base, scenario=args.scenario)
    print(json.dumps(result, indent=2))
    return 0 if result.get("ok") else 1


if __name__ == "__main__":
    raise SystemExit(main())
