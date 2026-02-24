"""Skill dispatcher for the aws_tool wrapper."""

from __future__ import annotations

import hashlib
import json
import os
from datetime import datetime, timezone
from typing import Any, Callable

from src.artifacts.store import ArtifactStore
from src.aws_tool.allowlist import get_allowlisted_skills
from src.aws_tool.aws_cli import run_aws_cli
from src.graph.compiler import ContextCompiler
from src.graph.context_graph import GraphStore
from src.graph.ontology import validate_constraints
from src.skills.loader import get_skill_definition
from src.skills.validator import (
    SkillValidationError,
    validate_output_against_schema,
    validate_payload_against_schema,
    validate_phase,
)
from src.summarizer.bedrock import summarize_with_bedrock
from src.summarizer.fallback import summarize


ALIASES = {
    "store_artifact": "upload_artifact",
    "record_receipt": "write_receipt",
}


def _is_truthy(value: str | None) -> bool:
    return str(value).lower() in {"1", "true", "yes", "on"}


def _utcnow() -> str:
    return datetime.now(timezone.utc).isoformat()


def _json(data: Any) -> str:
    return json.dumps(data, sort_keys=True, default=str, ensure_ascii=True)


def _normalize_skill_name(name: str) -> str:
    return ALIASES.get(name, name)


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
            "inputs": inputs,
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

    summary = f"{skill_name} {'succeeded' if exit_code == 0 else 'failed'}"
    if error_text:
        summary += f": {error_text}"

    receipt_id = graph.put_node(
        type="Receipt",
        data={
            "skill_name": skill_name,
            "status": "success" if exit_code == 0 else "failure",
            "summary": summary,
            "ts_utc": finished_at,
            "checksum": checksum,
            "exit_code": exit_code,
        },
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
    graph: GraphStore,
    artifacts: ArtifactStore,
    mock_mode: bool,
    log: Callable[[str], None],
) -> dict[str, Any]:
    run_id = payload.get("run_id", "run-unknown")

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

    raise RuntimeError(f"No executor implemented for skill '{skill}'.")


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
        output = _execute_skill_impl(resolved_skill, payload, graph, artifacts, mock_mode, log)
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
    output.setdefault("receipt_id", provenance["receipt_id"])
    output.setdefault("provenance", provenance)
    validate_output_against_schema(skill_def.get("outputs_schema", {}), output, resolved_skill)
    return output
