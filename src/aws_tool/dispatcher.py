"""Skill dispatcher for the aws_tool wrapper."""

from __future__ import annotations

import hashlib
import json
import os
import uuid
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from pathlib import Path
from typing import Any, Callable

from src.artifacts.store import ArtifactStore
from src.aws_tool.allowlist import get_allowlisted_skills
from src.aws_tool.aws_cli import run_aws_cli
from src.graph.compiler import TYPE_PRIORITY, ContextCompiler
from src.graph.context_graph import GraphStore
from src.graph.ontology import validate_constraints
from src.skills.loader import get_skill_definition
from src.skills.validator import (
    SkillValidationError,
    validate_output_against_schema,
    validate_payload_against_schema,
    validate_phase,
)
from src.summarizer.bedrock import resolve_bedrock_model_identifier, summarize_with_bedrock
from src.summarizer.fallback import summarize


ALIASES = {
    "store_artifact": "upload_artifact",
    "record_receipt": "write_receipt",
}


class GuardrailViolationError(RuntimeError):
    """Raised when deterministic policy checks fail after assembly."""

    def __init__(self, message: str, output: dict[str, Any]) -> None:
        super().__init__(message)
        self.output = output


def _is_truthy(value: str | None) -> bool:
    return str(value).lower() in {"1", "true", "yes", "on"}


def _utcnow() -> str:
    return datetime.now(timezone.utc).isoformat()


def _json(data: Any) -> str:
    return json.dumps(data, sort_keys=True, default=str, ensure_ascii=True)


def _json_safe(value: Any) -> Any:
    """Convert DynamoDB-native values (e.g. Decimal) into JSON-serializable types."""
    if isinstance(value, Decimal):
        return int(value) if value % 1 == 0 else float(value)
    if isinstance(value, dict):
        return {str(key): _json_safe(item) for key, item in value.items()}
    if isinstance(value, (list, tuple)):
        return [_json_safe(item) for item in value]
    return value


def _ddb_safe(value: Any) -> Any:
    """Convert values into DynamoDB-safe scalar/container types."""
    if isinstance(value, float):
        return Decimal(str(value))
    if isinstance(value, dict):
        return {str(key): _ddb_safe(item) for key, item in value.items()}
    if isinstance(value, (list, tuple)):
        return [_ddb_safe(item) for item in value]
    return value


def _normalize_skill_name(name: str) -> str:
    return ALIASES.get(name, name)


def _storage_safe(value: Any, *, mock_mode: bool) -> Any:
    if mock_mode:
        return _json_safe(value)
    return _ddb_safe(value)


def _write_provenance(
    graph: GraphStore,
    artifacts: ArtifactStore,
    session_id: str,
    skill_name: str,
    inputs: dict[str, Any],
    started_at: str,
    finished_at: str,
    exit_code: int,
    output: dict[str, Any] | None,
    error_text: str,
    logs: list[str],
) -> dict[str, Any]:
    session_node_id = f"session-{session_id}"
    graph.put_node(
        type="Session",
        data={"session_id": session_id},
        session_id=session_id,
        validated=True,
        node_id=session_node_id,
    )

    skill_call_id = graph.put_node(
        type="SkillCall",
        data={
            "skill_name": skill_name,
            "inputs": _storage_safe(inputs, mock_mode=graph.mock_mode),
            "started_at": started_at,
            "finished_at": finished_at,
            "exit_code": exit_code,
        },
        session_id=session_id,
        validated=exit_code == 0,
    )
    graph.put_edge(
        from_id=skill_call_id,
        edge_type="performed_by",
        to_id=session_node_id,
        session_id=session_id,
    )

    checksum = hashlib.sha256(
        _json(
            {
                "skill_name": skill_name,
                "inputs": inputs,
                "output": output,
                "error": error_text,
                "started_at": started_at,
                "finished_at": finished_at,
                "exit_code": exit_code,
            }
        ).encode("utf-8")
    ).hexdigest()

    policy_checks: dict[str, Any] | None = None
    if isinstance(output, dict):
        raw_policy = output.get("policy_checks")
        if isinstance(raw_policy, dict):
            policy_checks = _json_safe(raw_policy)

    summary = f"{skill_name} {'succeeded' if exit_code == 0 else 'failed'}"
    if policy_checks is not None:
        summary += f" (policy checks {'pass' if policy_checks.get('passed') else 'fail'})"
    if error_text:
        summary += f": {error_text}"

    receipt_data: dict[str, Any] = {
        "skill_name": skill_name,
        "status": "success" if exit_code == 0 else "failure",
        "summary": summary,
        "ts_utc": finished_at,
        "checksum": checksum,
        "exit_code": exit_code,
    }
    if policy_checks is not None:
        receipt_data["policy_checks"] = policy_checks
        receipt_data["policy_gate"] = "pass" if policy_checks.get("passed") else "fail"

    receipt_id = graph.put_node(
        type="Receipt",
        data=receipt_data,
        session_id=session_id,
        validated=exit_code == 0,
    )
    graph.put_edge(
        from_id=skill_call_id,
        edge_type="produces",
        to_id=receipt_id,
        session_id=session_id,
    )

    output_text = _json(output) if output is not None else ""
    log_text = "\n".join(logs).strip()
    sections: list[str] = []
    if output_text:
        sections.append(f"STDOUT\n{output_text}")
    if error_text:
        sections.append(f"STDERR\n{error_text}")
    if log_text:
        sections.append(f"LOGS\n{log_text}")

    artifact_node_id = None
    artifact_uri = None
    if sections:
        artifact_blob = "\n\n".join(sections).encode("utf-8")
        uploaded = artifacts.upload_artifact(
            session_id=session_id,
            name=f"{skill_name}-call.log",
            content_bytes=artifact_blob,
        )
        artifact_uri = str(uploaded["s3_uri"])
        artifact_node_id = graph.put_node(
            type="Artifact",
            data={
                "name": f"{skill_name}-call.log",
                "s3_uri": artifact_uri,
                "sha256": uploaded["sha256"],
                "bytes": uploaded["bytes"],
            },
            session_id=session_id,
            validated=True,
            artifact_ref=artifact_uri,
        )
        graph.put_edge(
            from_id=receipt_id,
            edge_type="references",
            to_id=artifact_node_id,
            session_id=session_id,
        )

    if error_text:
        error_id = graph.put_node(
            type="Error",
            data={
                "skill_name": skill_name,
                "message": error_text,
                "ts_utc": finished_at,
            },
            session_id=session_id,
            validated=False,
        )
        graph.put_edge(
            from_id=receipt_id,
            edge_type="caused_by",
            to_id=error_id,
            session_id=session_id,
        )

    return {
        "skill_call_id": skill_call_id,
        "receipt_id": receipt_id,
        "artifact_node_id": artifact_node_id,
        "artifact_uri": artifact_uri,
    }


def _execute_skill_impl(
    skill: str,
    payload: dict[str, Any],
    phase: str,
    graph: GraphStore,
    artifacts: ArtifactStore,
    mock_mode: bool,
    log: Callable[[str], None],
) -> dict[str, Any]:
    run_id = payload.get("run_id", "run-unknown")

    def node_payload(node: dict[str, Any]) -> dict[str, Any]:
        raw = node.get("data")
        if not isinstance(raw, dict):
            return {}
        return _json_safe(raw)

    def node_timestamp(node: dict[str, Any]) -> datetime:
        data = node_payload(node)
        candidates = [
            node.get("updated_at"),
            node.get("created_at"),
            data.get("ts_utc"),
            data.get("finished_at"),
            data.get("started_at"),
        ]
        for raw in candidates:
            if not raw:
                continue
            try:
                text = str(raw).replace("Z", "+00:00")
                parsed = datetime.fromisoformat(text)
                if parsed.tzinfo is None:
                    parsed = parsed.replace(tzinfo=timezone.utc)
                return parsed
            except ValueError:
                continue
        return datetime.fromtimestamp(0, tz=timezone.utc)

    def node_summary(node: dict[str, Any]) -> str:
        data = node_payload(node)
        for key in ("title", "summary", "text", "name", "skill_name"):
            if data.get(key):
                return str(data.get(key))
        return json.dumps(data, sort_keys=True, default=str)[:220]

    def normalize_string_list(value: Any) -> list[str]:
        if not isinstance(value, list):
            return []
        out = []
        for item in value:
            text = str(item).strip()
            if text:
                out.append(text)
        return sorted(set(out))

    def ensure_edge(from_id: str, edge_type: str, to_id: str) -> None:
        existing = graph.neighbors(from_id)
        for edge in existing:
            if (
                str(edge.get("edge_type") or "") == edge_type
                and str(edge.get("to_id") or "") == to_id
            ):
                return
        graph.put_edge(
            from_id=from_id,
            edge_type=edge_type,
            to_id=to_id,
            session_id=run_id,
        )

    def ensure_agent_node(agent_id: str) -> str:
        agent_node_id = f"agent-{run_id}-{agent_id}"
        existing_agent = graph.get_node(agent_node_id)
        existing_data = node_payload(existing_agent) if isinstance(existing_agent, dict) else {}
        graph.put_node(
            type="Agent",
            data={
                "agent_id": agent_id,
                "last_seen_at": _utcnow(),
                "role": existing_data.get("role"),
            },
            session_id=run_id,
            validated=True,
            node_id=agent_node_id,
        )
        return agent_node_id

    if skill == "assemble_context_view_agent":
        requested_phase = str(payload.get("phase") or "")
        if requested_phase != phase:
            raise SkillValidationError(
                "assemble_context_view_agent payload phase must match requested --phase "
                f"('{requested_phase}' != '{phase}')."
            )

        token_budget = int(payload["token_budget"])
        compiler = ContextCompiler(graph_store=graph, artifact_store=artifacts, mock_mode=mock_mode)
        assembled = compiler.assemble_context_view_agent(
            session_id=run_id,
            task=str(payload["task"]),
            phase=phase,
            token_budget=token_budget,
            retrieval_hints=payload.get("retrieval_hints"),
        )
        checks = assembled.get("policy_checks")
        if isinstance(checks, dict) and not bool(checks.get("passed")):
            failed = checks.get("failed_checks")
            failed_text = ", ".join(str(item) for item in failed) if isinstance(failed, list) else "unknown failure"
            raise GuardrailViolationError(
                f"Assembly guardrail checks failed: {failed_text}",
                output=assembled,
            )

        log(
            "Assembled context view with "
            f"{len(assembled.get('selected_items', []))} items under budget {token_budget}."
        )
        return assembled

    if skill == "bedrock_infer":
        session_key = str(payload.get("session_key") or "default")
        prompt = str(payload["prompt"])
        model_id = str(payload.get("model_id") or resolve_bedrock_model_identifier())
        max_tokens = int(payload.get("max_tokens") or 256)
        max_history_turns = int(payload.get("max_history_turns") or 8)
        if max_history_turns < 0:
            max_history_turns = 0
        temperature_raw = payload.get("temperature")
        temperature = float(temperature_raw) if isinstance(temperature_raw, (int, float)) else 0.0
        reset_session = bool(payload.get("reset_session")) if "reset_session" in payload else False
        system_prompt_raw = payload.get("system_prompt")
        system_prompt = str(system_prompt_raw).strip() if isinstance(system_prompt_raw, str) else ""

        session_graph = graph.list_session(run_id)
        all_nodes = session_graph.get("nodes", [])

        def is_bedrock_turn(node: dict[str, Any]) -> bool:
            if str(node.get("type")) != "Decision":
                return False
            data = node_payload(node)
            if str(data.get("kind") or "") != "bedrock_turn":
                return False
            if str(data.get("session_key") or "default") != session_key:
                return False
            return True

        prior_turns = [node for node in all_nodes if is_bedrock_turn(node)]
        prior_turns.sort(
            key=lambda node: (
                int(node_payload(node).get("turn_index", 0)),
                node_timestamp(node).timestamp(),
            )
        )

        history_turns: list[dict[str, Any]] = []
        if not reset_session:
            if max_history_turns == 0:
                history_turns = []
            else:
                history_turns = prior_turns[-max_history_turns:]

        messages: list[dict[str, Any]] = []
        for node in history_turns:
            data = node_payload(node)
            previous_prompt = str(data.get("prompt") or "")
            previous_response = str(data.get("response") or "")
            if previous_prompt:
                messages.append(
                    {
                        "role": "user",
                        "content": [{"type": "text", "text": previous_prompt}],
                    }
                )
            if previous_response:
                messages.append(
                    {
                        "role": "assistant",
                        "content": [{"type": "text", "text": previous_response}],
                    }
                )
        messages.append(
            {
                "role": "user",
                "content": [{"type": "text", "text": prompt}],
            }
        )

        if mock_mode:
            text_out = f"[mock-bedrock:{session_key}] {prompt[:240]}"
        else:
            import boto3

            client = boto3.client("bedrock-runtime")
            body: dict[str, Any] = {
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": max_tokens,
                "temperature": temperature,
                "messages": messages,
            }
            if system_prompt:
                body["system"] = [{"type": "text", "text": system_prompt}]

            response = client.invoke_model(
                modelId=model_id,
                contentType="application/json",
                accept="application/json",
                body=json.dumps(body),
            )
            response_payload = json.loads(response["body"].read().decode("utf-8"))
            chunks = response_payload.get("content", [])
            text_out = "".join(chunk.get("text", "") for chunk in chunks if isinstance(chunk, dict))
            if not text_out.strip():
                raise RuntimeError("Bedrock returned an empty response payload.")

        next_turn_index = 1
        if prior_turns:
            latest_data = node_payload(prior_turns[-1])
            next_turn_index = int(latest_data.get("turn_index", 0)) + 1

        preview = " ".join(text_out.split())
        if len(preview) > 140:
            preview = preview[:137] + "..."

        graph.put_node(
            type="Decision",
            data={
                "summary": f"bedrock_infer[{session_key}] turn {next_turn_index}: {preview}",
                "kind": "bedrock_turn",
                "session_key": session_key,
                "turn_index": next_turn_index,
                "model_id": model_id,
                "phase": phase,
                "history_turns_used": len(history_turns),
                "prompt": prompt,
                "response": text_out,
                "ts_utc": _utcnow(),
            },
            session_id=run_id,
            validated=True,
        )
        log(
            "Bedrock inference complete for "
            f"session_key={session_key}, turn={next_turn_index}, history_used={len(history_turns)}."
        )
        return {
            "text": text_out,
            "model_id": model_id,
            "session_key": session_key,
            "turn_index": next_turn_index,
            "history_turns_used": len(history_turns),
            "saved_memory": True,
        }

    if skill == "resolve_identity":
        if mock_mode:
            log("Using mock identity path.")
            return {
                "account_id": "000000000000",
                "arn": "arn:aws:sts::000000000000:assumed-role/workshop/mock-user",
                "user_id": "mock-user",
            }

        cli = run_aws_cli(["sts", "get-caller-identity", "--output", "json"], expect_json=True)
        log(f"Executed AWS CLI: {' '.join(cli.args)}")
        if cli.exit_code != 0:
            raise RuntimeError(cli.stderr.strip() or cli.stdout.strip() or "sts get-caller-identity failed")
        if not isinstance(cli.parsed_json, dict):
            raise RuntimeError("STS response was not valid JSON.")
        identity = cli.parsed_json
        return {
            "account_id": str(identity.get("Account", "")),
            "arn": str(identity.get("Arn", "")),
            "user_id": str(identity.get("UserId", "")),
        }

    if skill == "upsert_node":
        node = graph.upsert_node(
            run_id=payload["run_id"],
            node_type=payload["node_type"],
            node_id=payload["node_id"],
            payload=payload["payload"],
        )
        log(f"Upserted node {payload['node_id']} ({payload['node_type']}).")
        return {
            "node_id": node["node_id"],
            "version": node["version"],
        }

    if skill == "link_edge":
        edge = graph.put_checked_edge(
            run_id=payload["run_id"],
            from_id=payload["from_id"],
            to_id=payload["to_id"],
            edge_type=payload["edge_type"],
        )
        log(f"Created edge {edge['edge_id']} ({payload['edge_type']}).")
        return {"edge_id": edge["edge_id"]}

    if skill == "upload_artifact":
        local_path = payload.get("local_path")
        content = payload.get("content")
        if bool(local_path) == bool(content):
            raise SkillValidationError("upload_artifact requires exactly one of 'local_path' or 'content'.")

        if local_path:
            uploaded = artifacts.upload_artifact(
                session_id=run_id,
                name=payload["name"],
                local_path=str(local_path),
            )
        else:
            uploaded = artifacts.upload_artifact(
                session_id=run_id,
                name=payload["name"],
                content_bytes=str(content).encode("utf-8"),
            )

        artifact_id = graph.put_node(
            type="Artifact",
            data={
                "name": payload["name"],
                "s3_uri": uploaded["s3_uri"],
                "sha256": uploaded["sha256"],
                "bytes": uploaded["bytes"],
            },
            session_id=run_id,
            validated=True,
            artifact_ref=str(uploaded["s3_uri"]),
        )
        log(f"Uploaded artifact {artifact_id} to {uploaded['s3_uri']}.")
        return {
            "s3_uri": uploaded["s3_uri"],
            "sha256": uploaded["sha256"],
            "bytes": uploaded["bytes"],
            "artifact_id": artifact_id,
        }

    if skill == "write_receipt":
        ts_utc = _utcnow()
        checksum = hashlib.sha256(
            _json(
                {
                    "run_id": payload["run_id"],
                    "skill_name": payload["skill_name"],
                    "status": payload["status"],
                    "summary": payload["summary"],
                    "artifact_uri": payload.get("artifact_uri"),
                    "ts_utc": ts_utc,
                }
            ).encode("utf-8")
        ).hexdigest()

        receipt_id = graph.put_node(
            type="Receipt",
            data={
                "skill_name": payload["skill_name"],
                "status": payload["status"],
                "summary": payload["summary"],
                "artifact_uri": payload.get("artifact_uri"),
                "ts_utc": ts_utc,
                "checksum": checksum,
                "exit_code": 0 if payload["status"] == "success" else 1,
            },
            session_id=run_id,
            validated=payload["status"] == "success",
            artifact_ref=payload.get("artifact_uri"),
        )
        log(f"Wrote explicit receipt {receipt_id}.")
        return {
            "receipt_id": receipt_id,
            "ts_utc": ts_utc,
        }

    if skill == "compile_context_pack":
        run = graph.list_run(payload["run_id"])
        violations = validate_constraints(run["nodes"], run["edges"])
        if violations:
            raise RuntimeError("Ontology constraint violation(s): " + " | ".join(violations))

        compiler = ContextCompiler()
        pack = compiler.compile(
            run_id=payload["run_id"],
            nodes=run["nodes"],
            edges=run["edges"],
            max_items=payload["max_items"],
            byte_budget=payload["byte_budget"],
        )
        log(f"Compiled pack {pack['pack_id']} with {len(pack['items'])} items.")
        return pack

    if skill == "summarize_evidence":
        max_chars = payload.get("max_chars", 800)
        evidence_parts = [artifacts.get_text(ref) for ref in payload["evidence_refs"]]
        source_text = "\n".join([part for part in evidence_parts if part])

        provider = "fallback"
        summary_text = summarize(source_text, max_chars=max_chars)

        if _is_truthy(os.getenv("BEDROCK_ENABLED", "0")) and not mock_mode:
            try:
                summary_text = summarize_with_bedrock(source_text, max_chars=max_chars)
                provider = "bedrock"
                log("Used Bedrock summarizer.")
            except Exception as exc:
                provider = "fallback"
                summary_text = summarize(source_text, max_chars=max_chars)
                log(f"Bedrock unavailable, fallback used: {exc}")
        else:
            log("Used fallback summarizer.")

        return {
            "summary": summary_text,
            "provider": provider,
        }

    if skill == "create_task":
        state = str(payload.get("state") or "open")
        task_data: dict[str, Any] = {
            "title": payload["title"],
            "description": payload.get("description"),
            "state": state,
            "ts_utc": _utcnow(),
        }
        task_id = graph.put_node(
            type="Task",
            data=task_data,
            session_id=run_id,
            validated=False,
            node_id=payload.get("task_id"),
        )
        log(f"Created task {task_id}.")
        return {"task_id": task_id, "state": state}

    if skill == "claim_task":
        task_id = str(payload["task_id"])
        task_node = graph.get_node(task_id)
        if not task_node or str(task_node.get("type")) != "Task":
            raise SkillValidationError(f"Task not found or wrong type: {task_id}")

        lease_seconds_raw = payload.get("lease_seconds")
        lease_expires_at = None
        if lease_seconds_raw is not None:
            try:
                lease_seconds = int(lease_seconds_raw)
            except (TypeError, ValueError) as exc:
                raise SkillValidationError("claim_task.lease_seconds must be an integer.") from exc
            if lease_seconds <= 0:
                raise SkillValidationError("claim_task.lease_seconds must be > 0 when provided.")
            lease_expires_at = (datetime.now(timezone.utc) + timedelta(seconds=lease_seconds)).isoformat()

        task_data = node_payload(task_node)
        task_data.update(
            {
                "state": "claimed",
                "assigned_to": payload["agent_id"],
                "claimed_at": _utcnow(),
            }
        )
        if lease_expires_at:
            task_data["lease_expires_at"] = lease_expires_at
        graph.put_node(
            type="Task",
            data=task_data,
            session_id=run_id,
            validated=bool(task_node.get("validated")),
            node_id=task_id,
        )

        claim_id = graph.put_node(
            type="Claim",
            data={
                "state": str(payload.get("claim_state") or "claimed"),
                "agent_id": payload["agent_id"],
                "task_id": task_id,
                "ts_utc": _utcnow(),
                "lease_expires_at": lease_expires_at,
            },
            session_id=run_id,
            validated=True,
        )
        graph.put_edge(
            from_id=claim_id,
            edge_type="CLAIM_APPLIES_TO",
            to_id=task_id,
            session_id=run_id,
        )
        log(f"Claimed task {task_id} with claim {claim_id}.")
        return {"claim_id": claim_id, "task_id": task_id, "lease_expires_at": lease_expires_at}

    if skill == "complete_task":
        task_id = str(payload["task_id"])
        task_node = graph.get_node(task_id)
        if not task_node or str(task_node.get("type")) != "Task":
            raise SkillValidationError(f"Task not found or wrong type: {task_id}")

        task_data = node_payload(task_node)
        task_data.update(
            {
                "state": "completed",
                "completed_by": payload["agent_id"],
                "completed_at": _utcnow(),
                "completion_summary": payload["summary"],
                "completion_status": str(payload.get("status") or "success"),
                "completion_artifact_uri": payload.get("artifact_uri"),
            }
        )
        graph.put_node(
            type="Task",
            data=task_data,
            session_id=run_id,
            validated=bool(task_node.get("validated")),
            node_id=task_id,
        )
        log(f"Completed task {task_id} (pending verification).")
        return {"task_id": task_id, "status": str(payload.get("status") or "success")}

    if skill == "verify_task":
        task_id = str(payload["task_id"])
        task_node = graph.get_node(task_id)
        if not task_node or str(task_node.get("type")) != "Task":
            raise SkillValidationError(f"Task not found or wrong type: {task_id}")

        check_type = str(payload["check_type"])
        artifact_uri = str(payload.get("artifact_uri") or "")
        status = "pass"
        details: dict[str, Any] = {"check_type": check_type, "artifact_uri": artifact_uri}

        if check_type == "s3_head_object":
            if mock_mode:
                if artifact_uri.startswith("s3://"):
                    # Keep mock behavior deterministic while allowing scenario flows to force failures.
                    if "missing" in artifact_uri.lower():
                        status = "fail"
                        details["error"] = "mock_mode: simulated missing S3 object"
                    else:
                        details["note"] = "mock_mode: skipped s3 head-object"
                else:
                    local_artifact = Path(artifact_uri)
                    if local_artifact.exists():
                        details["note"] = "mock_mode: verified local artifact path exists"
                        details["local_path"] = str(local_artifact)
                    else:
                        status = "fail"
                        details["error"] = f"mock_mode: local artifact path not found: {artifact_uri}"
            else:
                if not artifact_uri.startswith("s3://"):
                    raise SkillValidationError("verify_task with s3_head_object requires artifact_uri starting with s3://")
                bucket_key = artifact_uri.replace("s3://", "", 1)
                if "/" not in bucket_key:
                    raise SkillValidationError("artifact_uri must be of form s3://bucket/key")
                bucket, key = bucket_key.split("/", 1)
                cli = run_aws_cli(
                    ["s3api", "head-object", "--bucket", bucket, "--key", key, "--output", "json"],
                    expect_json=True,
                )
                log(f"Executed AWS CLI: {' '.join(cli.args)}")
                if cli.exit_code != 0:
                    status = "fail"
                    details["error"] = cli.stderr.strip() or cli.stdout.strip() or "s3 head-object failed"
                elif isinstance(cli.parsed_json, dict):
                    details["head_object"] = _json_safe(cli.parsed_json)
        elif check_type == "noop":
            details["note"] = "noop verification"
        else:
            raise SkillValidationError(f"Unsupported verify_task check_type: {check_type}")

        test_result_id = graph.put_node(
            type="TestResult",
            data={
                "status": status,
                "check_type": check_type,
                "artifact_uri": artifact_uri or None,
                "notes": payload.get("notes"),
                "details": details,
                "ts_utc": _utcnow(),
            },
            session_id=run_id,
            validated=status == "pass",
        )

        task_data = node_payload(task_node)
        task_data.update(
            {
                "state": "done" if status == "pass" else "blocked",
                "verified_at": _utcnow(),
                "verification_status": status,
                "verification_test_result_id": test_result_id,
            }
        )
        graph.put_node(
            type="Task",
            data=task_data,
            session_id=run_id,
            validated=status == "pass",
            node_id=task_id,
        )

        log(f"Verified task {task_id}: {status} ({test_result_id}).")
        return {"test_result_id": test_result_id, "status": status}

    if skill == "search_nodes":
        query = str(payload["query"]).strip().lower()
        limit = int(payload.get("limit") or 10)
        if limit <= 0:
            limit = 10

        types = payload.get("types")
        type_filter = {str(t) for t in types} if isinstance(types, list) else None
        validated_only = bool(payload.get("validated_only")) if "validated_only" in payload else False

        session_graph = graph.list_session(run_id)
        nodes = session_graph.get("nodes", [])

        def matches(node: dict[str, Any]) -> bool:
            if type_filter is not None and str(node.get("type")) not in type_filter:
                return False
            if validated_only and not bool(node.get("validated")):
                return False
            if not query:
                return True
            blob = json.dumps(
                {"type": node.get("type"), "data": node_payload(node)},
                sort_keys=True,
                default=str,
            ).lower()
            terms = [t for t in query.split() if len(t) >= 3]
            if not terms:
                return query in blob
            return any(t in blob for t in terms)

        matched = [node for node in nodes if matches(node)]
        matched.sort(
            key=lambda node: (
                1 if bool(node.get("validated")) else 0,
                node_timestamp(node).timestamp(),
                TYPE_PRIORITY.get(str(node.get("type") or "Unknown"), 30),
            ),
            reverse=True,
        )

        out = []
        for node in matched[:limit]:
            out.append(
                {
                    "node_id": str(node.get("node_id", "")),
                    "type": str(node.get("type", "")),
                    "validated": bool(node.get("validated")),
                    "ts_utc": node_timestamp(node).isoformat(),
                    "summary": node_summary(node),
                }
            )
        log(f"search_nodes matched {len(out)} of {len(matched)} candidates.")
        return {"matches": out}

    if skill == "get_node":
        node = graph.get_node(str(payload["node_id"]))
        if not node:
            raise SkillValidationError(f"Node not found: {payload['node_id']}")
        return {"node": _json_safe(node)}

    if skill == "neighbors":
        node_id = str(payload["node_id"])
        direction = str(payload.get("direction") or "outbound")
        limit = int(payload.get("limit") or 200)
        if limit <= 0:
            limit = 200

        edges = graph.neighbors(node_id) if direction == "outbound" else graph.reverse_neighbors(node_id)
        edges = [_json_safe(edge) for edge in edges][:limit]
        return {"edges": edges}

    if skill == "list_tasks":
        state_filter = payload.get("state")
        assigned_filter = payload.get("assigned_to")
        limit = int(payload.get("limit") or 50)
        if limit <= 0:
            limit = 50

        session_graph = graph.list_session(run_id)
        nodes = session_graph.get("nodes", [])
        tasks = [node for node in nodes if str(node.get("type")) == "Task"]
        out = []
        for node in tasks:
            data = node_payload(node)
            state = str(data.get("state") or "open")
            assigned = str(data.get("assigned_to") or "")
            if state_filter and state != str(state_filter):
                continue
            if assigned_filter and assigned != str(assigned_filter):
                continue
            out.append(
                {
                    "task_id": str(node.get("node_id", "")),
                    "title": str(data.get("title", "")),
                    "state": state,
                    "assigned_to": assigned,
                    "validated": bool(node.get("validated")),
                    "updated_at": node_timestamp(node).isoformat(),
                }
            )
        out.sort(key=lambda item: item.get("updated_at", ""), reverse=True)
        return {"tasks": out[:limit]}

    if skill == "create_channel":
        channel_name = str(payload["channel_name"]).strip()
        if not channel_name:
            raise SkillValidationError("create_channel.channel_name must be a non-empty string.")

        topic = str(payload.get("topic") or "").strip()
        participants = normalize_string_list(payload.get("participants"))
        channel_id = str(payload.get("channel_id") or "").strip() or f"channel-{uuid.uuid4().hex[:12]}"

        existing = graph.get_node(channel_id)
        if existing and str(existing.get("type")) != "Channel":
            raise SkillValidationError(f"Node '{channel_id}' exists and is not a Channel.")

        existing_data = node_payload(existing) if isinstance(existing, dict) else {}
        merged_participants = sorted(set(normalize_string_list(existing_data.get("participants")) + participants))
        channel_data = {
            "channel_name": channel_name,
            "topic": topic or str(existing_data.get("topic") or ""),
            "participants": merged_participants,
            "created_at": str(existing_data.get("created_at") or _utcnow()),
            "updated_at": _utcnow(),
        }

        graph.put_node(
            type="Channel",
            data=channel_data,
            session_id=run_id,
            validated=True,
            node_id=channel_id,
        )

        for agent_id in merged_participants:
            agent_node_id = ensure_agent_node(agent_id)
            ensure_edge(agent_node_id, "PARTICIPATES_IN", channel_id)

        log(f"Created/updated channel {channel_id} with {len(merged_participants)} participants.")
        return {
            "channel_id": channel_id,
            "channel_name": channel_name,
            "topic": channel_data["topic"],
            "participant_count": len(merged_participants),
        }

    if skill == "post_channel_message":
        channel_id = str(payload["channel_id"]).strip()
        channel_node = graph.get_node(channel_id)
        if not channel_node or str(channel_node.get("type")) != "Channel":
            raise SkillValidationError(f"Channel not found or wrong type: {channel_id}")

        agent_id = str(payload["agent_id"]).strip()
        if not agent_id:
            raise SkillValidationError("post_channel_message.agent_id must be a non-empty string.")

        message_text = str(payload["message"]).strip()
        if not message_text:
            raise SkillValidationError("post_channel_message.message must be a non-empty string.")

        task_id = str(payload.get("task_id") or "").strip()
        if task_id:
            task_node = graph.get_node(task_id)
            if not task_node or str(task_node.get("type")) != "Task":
                raise SkillValidationError(f"Task not found or wrong type: {task_id}")

        now_utc = _utcnow()
        message_id = str(payload.get("message_id") or "").strip() or f"message-{uuid.uuid4().hex[:12]}"
        level = str(payload.get("level") or "info").strip()

        graph.put_node(
            type="Message",
            data={
                "channel_id": channel_id,
                "agent_id": agent_id,
                "task_id": task_id or None,
                "message": message_text,
                "level": level,
                "ts_utc": now_utc,
            },
            session_id=run_id,
            validated=True,
            node_id=message_id,
        )

        agent_node_id = ensure_agent_node(agent_id)
        ensure_edge(agent_node_id, "PARTICIPATES_IN", channel_id)
        ensure_edge(channel_id, "CHANNEL_HAS_MESSAGE", message_id)
        ensure_edge(message_id, "MESSAGE_AUTHORED_BY", agent_node_id)
        if task_id:
            ensure_edge(message_id, "MESSAGE_RELATES_TO_TASK", task_id)

        channel_data = node_payload(channel_node)
        participants = normalize_string_list(channel_data.get("participants"))
        if agent_id not in participants:
            participants.append(agent_id)
            participants = sorted(set(participants))
        message_count = int(channel_data.get("message_count") or 0) + 1
        graph.put_node(
            type="Channel",
            data={
                **channel_data,
                "participants": participants,
                "last_message_at": now_utc,
                "last_message_id": message_id,
                "last_message_agent": agent_id,
                "message_count": message_count,
                "updated_at": now_utc,
            },
            session_id=run_id,
            validated=True,
            node_id=channel_id,
        )

        log(f"Posted message {message_id} in channel {channel_id}.")
        return {
            "message_id": message_id,
            "channel_id": channel_id,
            "agent_id": agent_id,
            "task_id": task_id or "",
            "ts_utc": now_utc,
        }

    if skill == "list_channel_messages":
        channel_id = str(payload["channel_id"]).strip()
        limit = int(payload.get("limit") or 50)
        if limit <= 0:
            limit = 50

        channel_node = graph.get_node(channel_id)
        if not channel_node or str(channel_node.get("type")) != "Channel":
            raise SkillValidationError(f"Channel not found or wrong type: {channel_id}")
        channel_data = node_payload(channel_node)

        session_graph = graph.list_session(run_id)
        nodes = session_graph.get("nodes", [])
        matched = []
        for node in nodes:
            if str(node.get("type")) != "Message":
                continue
            data = node_payload(node)
            if str(data.get("channel_id") or "") != channel_id:
                continue
            matched.append(
                {
                    "message_id": str(node.get("node_id") or ""),
                    "channel_id": channel_id,
                    "agent_id": str(data.get("agent_id") or ""),
                    "task_id": str(data.get("task_id") or ""),
                    "message": str(data.get("message") or ""),
                    "level": str(data.get("level") or "info"),
                    "ts_utc": node_timestamp(node).isoformat(),
                }
            )
        matched.sort(key=lambda row: str(row.get("ts_utc") or ""), reverse=True)
        return {
            "channel_id": channel_id,
            "channel_name": str(channel_data.get("channel_name") or ""),
            "messages": matched[:limit],
        }

    raise RuntimeError(f"No executor implemented for skill '{skill}'.")


def _post_provenance_links(
    *,
    graph: GraphStore,
    session_id: str,
    skill: str,
    payload: dict[str, Any],
    output: dict[str, Any],
    provenance: dict[str, Any],
) -> None:
    """Attach coordination edges that depend on the auto-generated provenance receipt."""
    task_id = payload.get("task_id")
    if not isinstance(task_id, str) or not task_id:
        return

    receipt_id = provenance.get("receipt_id")
    if not isinstance(receipt_id, str) or not receipt_id:
        return

    if skill in {"claim_task", "complete_task", "verify_task", "post_channel_message"}:
        graph.put_edge(
            from_id=task_id,
            edge_type="TASK_EVIDENCED_BY",
            to_id=receipt_id,
            session_id=session_id,
        )

    if skill == "verify_task":
        test_result_id = output.get("test_result_id")
        if isinstance(test_result_id, str) and test_result_id:
            graph.put_edge(
                from_id=task_id,
                edge_type="TASK_VERIFIED_BY",
                to_id=test_result_id,
                session_id=session_id,
            )
            graph.put_edge(
                from_id=test_result_id,
                edge_type="verified_by",
                to_id=receipt_id,
                session_id=session_id,
            )


def execute_skill(
    skill: str,
    payload: dict[str, Any],
    session_id: str,
    phase: str,
) -> dict[str, Any]:
    resolved_skill = _normalize_skill_name(skill)
    allowlist = get_allowlisted_skills()
    if resolved_skill not in allowlist:
        allowed = ", ".join(sorted(allowlist))
        raise RuntimeError(f"Skill '{skill}' is not allowlisted. Allowed: {allowed}")

    skill_def = get_skill_definition(resolved_skill)
    validate_phase(skill_def, phase)
    validate_payload_against_schema(skill_def.get("inputs_schema", {}), payload, resolved_skill)

    mock_mode = _is_truthy(os.getenv("CEW_MOCK_AWS", "0"))
    graph = GraphStore(mock_mode=mock_mode)
    artifacts = ArtifactStore(mock_mode=mock_mode)

    started_at = _utcnow()
    finished_at = started_at
    logs: list[str] = []

    def log(message: str) -> None:
        logs.append(f"[{_utcnow()}] {message}")

    output: dict[str, Any] | None = None
    exit_code = 0
    error_text = ""

    try:
        output = _execute_skill_impl(
            resolved_skill,
            payload,
            phase,
            graph,
            artifacts,
            mock_mode,
            log,
        )
    except GuardrailViolationError as exc:
        exit_code = 1
        output = exc.output
        error_text = str(exc)
    except Exception as exc:
        exit_code = 1
        error_text = str(exc)
    finally:
        finished_at = _utcnow()

    provenance = _write_provenance(
        graph=graph,
        artifacts=artifacts,
        session_id=session_id,
        skill_name=resolved_skill,
        inputs=payload,
        started_at=started_at,
        finished_at=finished_at,
        exit_code=exit_code,
        output=output,
        error_text=error_text,
        logs=logs,
    )

    if exit_code != 0:
        raise RuntimeError(error_text)

    assert output is not None
    _post_provenance_links(
        graph=graph,
        session_id=session_id,
        skill=resolved_skill,
        payload=payload,
        output=output,
        provenance=provenance,
    )
    output.setdefault("receipt_id", provenance["receipt_id"])
    output.setdefault("provenance", provenance)
    validate_output_against_schema(skill_def.get("outputs_schema", {}), output, resolved_skill)
    return output
