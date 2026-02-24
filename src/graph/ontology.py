"""Ontology loader and best-effort validators."""

from __future__ import annotations

from pathlib import Path
from typing import Any

import yaml


class OntologyError(ValueError):
    """Raised when ontology rules are violated."""


_ONT_CACHE: dict[str, Any] | None = None


def _ontology_file() -> Path:
    return Path(__file__).resolve().parents[2] / "ontology" / "ontology.yml"


def load_ontology(force_reload: bool = False) -> dict[str, Any]:
    global _ONT_CACHE
    if _ONT_CACHE is not None and not force_reload:
        return _ONT_CACHE

    path = _ontology_file()
    if not path.exists():
        raise OntologyError(f"Ontology file not found: {path}")

    raw = yaml.safe_load(path.read_text(encoding="utf-8"))
    if not isinstance(raw, dict):
        raise OntologyError("Ontology file must be a YAML object.")

    for key in ["node_types", "edge_types", "constraints"]:
        if key not in raw:
            raise OntologyError(f"Ontology is missing required key '{key}'.")

    _ONT_CACHE = raw
    return raw


def _node_defs() -> dict[str, Any]:
    defs = load_ontology().get("node_types", {})
    if not isinstance(defs, dict):
        raise OntologyError("node_types must be an object in ontology.yml")
    return defs


def _edge_defs() -> dict[str, Any]:
    defs = load_ontology().get("edge_types", {})
    if not isinstance(defs, dict):
        raise OntologyError("edge_types must be an object in ontology.yml")
    return defs


def validate_node_type(node_type: str) -> None:
    if node_type not in _node_defs():
        allowed = ", ".join(sorted(_node_defs().keys()))
        raise OntologyError(f"Invalid node_type '{node_type}'. Allowed: {allowed}")


def validate_edge_type(edge_type: str) -> None:
    if edge_type not in _edge_defs():
        allowed = ", ".join(sorted(_edge_defs().keys()))
        raise OntologyError(f"Invalid edge_type '{edge_type}'. Allowed: {allowed}")


def validate_node_write(node_type: str, data: dict[str, Any]) -> None:
    validate_node_type(node_type)
    node_def = _node_defs()[node_type]
    required = node_def.get("required_fields", [])
    if not isinstance(required, list):
        raise OntologyError(f"Node definition for '{node_type}' has invalid required_fields.")

    missing = [field for field in required if field not in data]
    if missing:
        raise OntologyError(
            f"Node '{node_type}' missing required field(s): {', '.join(sorted(missing))}."
        )


def validate_edge_write(
    edge_type: str,
    from_type: str | None = None,
    to_type: str | None = None,
) -> None:
    validate_edge_type(edge_type)
    edge_def = _edge_defs()[edge_type]

    from_types = edge_def.get("from_types")
    to_types = edge_def.get("to_types")

    if from_type and isinstance(from_types, list) and from_types and from_type not in from_types:
        allowed = ", ".join(from_types)
        raise OntologyError(
            f"Edge '{edge_type}' cannot originate from '{from_type}'. Allowed: {allowed}."
        )

    if to_type and isinstance(to_types, list) and to_types and to_type not in to_types:
        allowed = ", ".join(to_types)
        raise OntologyError(f"Edge '{edge_type}' cannot target '{to_type}'. Allowed: {allowed}.")


def _normalize_node(node: dict[str, Any]) -> tuple[str, dict[str, Any], str | None]:
    node_type = str(node.get("node_type") or node.get("type") or "")
    payload = node.get("payload") if isinstance(node.get("payload"), dict) else node.get("data", {})
    node_id = node.get("node_id")
    if not isinstance(payload, dict):
        payload = {}
    return node_type, payload, str(node_id) if node_id is not None else None


def _normalize_edge(edge: dict[str, Any]) -> tuple[str, str | None, str | None]:
    return (
        str(edge.get("edge_type") or ""),
        str(edge.get("from_id")) if edge.get("from_id") is not None else None,
        str(edge.get("to_id")) if edge.get("to_id") is not None else None,
    )


def validate_constraints(nodes: list[dict[str, Any]], edges: list[dict[str, Any]]) -> list[str]:
    """Best-effort validation of three core rules from ontology constraints."""
    violations: list[str] = []

    by_id: dict[str, tuple[str, dict[str, Any]]] = {}
    for node in nodes:
        node_type, payload, node_id = _normalize_node(node)
        if node_id:
            by_id[node_id] = (node_type, payload)

    # Rule 1: each SkillExecution has exactly one inbound RUN_HAS_STEP edge.
    for node in nodes:
        node_type, _, node_id = _normalize_node(node)
        if node_type != "SkillExecution" or not node_id:
            continue
        inbound = [
            e
            for e in edges
            if _normalize_edge(e)[0] == "RUN_HAS_STEP" and _normalize_edge(e)[2] == node_id
        ]
        if len(inbound) != 1:
            violations.append(
                f"SkillExecution '{node_id}' must have exactly one inbound RUN_HAS_STEP edge."
            )

    # Rule 2: Receipt includes status/ts_utc/checksum.
    for node in nodes:
        node_type, payload, node_id = _normalize_node(node)
        if node_type != "Receipt" or not node_id:
            continue
        missing = [field for field in ["status", "ts_utc", "checksum"] if field not in payload]
        if missing:
            violations.append(
                f"Receipt '{node_id}' missing required fields: {', '.join(sorted(missing))}."
            )

    # Rule 3: verified Claim must be supported by success Receipt via CLAIM_SUPPORTED_BY.
    for node in nodes:
        node_type, payload, node_id = _normalize_node(node)
        if node_type != "Claim" or payload.get("state") != "verified" or not node_id:
            continue
        support_edges = [
            e for e in edges if _normalize_edge(e)[0] == "CLAIM_SUPPORTED_BY" and _normalize_edge(e)[1] == node_id
        ]
        if not support_edges:
            violations.append(f"Verified Claim '{node_id}' must have CLAIM_SUPPORTED_BY edge(s).")
            continue

        ok = False
        for edge in support_edges:
            _, _, to_id = _normalize_edge(edge)
            if not to_id:
                continue
            target = by_id.get(to_id)
            if not target:
                continue
            target_type, target_payload = target
            if target_type == "Receipt" and target_payload.get("status") == "success":
                ok = True
                break
        if not ok:
            violations.append(
                f"Verified Claim '{node_id}' must be supported by a success Receipt node."
            )

    return violations
