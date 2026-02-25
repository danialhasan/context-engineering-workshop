"""Context compiler with strategy toggles and token-budget packing."""

from __future__ import annotations

import hashlib
import json
import math
import os
from collections import deque
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any

import boto3
from botocore.exceptions import ClientError

from src.artifacts.store import ArtifactStore
from src.graph.context_graph import GraphStore
from src.skills.loader import load_skill_definitions
from src.summarizer.bedrock import summarize_with_bedrock
from src.summarizer.fallback import summarize


TYPE_PRIORITY: dict[str, int] = {
    "Objective": 100,
    "Plan": 95,
    "Decision": 90,
    "Receipt": 85,
    "TestResult": 80,
    "Summary": 75,
    "Claim": 70,
    "Run": 65,
    "SkillExecution": 60,
    "SkillCall": 55,
    "Artifact": 40,
    "Error": 20,
}


def _json_safe(value: Any) -> Any:
    """Convert DynamoDB-native values (e.g. Decimal) into JSON-serializable types."""
    if isinstance(value, Decimal):
        return int(value) if value % 1 == 0 else float(value)
    if isinstance(value, dict):
        return {str(key): _json_safe(item) for key, item in value.items()}
    if isinstance(value, (list, tuple)):
        return [_json_safe(item) for item in value]
    return value


def allowed_skills_for_phase(phase: str) -> list[str]:
    defs = load_skill_definitions()
    allowed = [
        name
        for name, skill_def in defs.items()
        if phase in (skill_def.get("allowed_phases") or [])
    ]
    return sorted(allowed)


def evaluate_assembly_policy_checks(
    *,
    selected_items: list[dict[str, Any]],
    token_estimate: int,
    token_budget: int,
    phase: str,
    requested_skills: list[str] | None = None,
) -> dict[str, Any]:
    requested = sorted({str(skill) for skill in (requested_skills or []) if str(skill).strip()})
    allowed = allowed_skills_for_phase(phase)
    allowed_set = set(allowed)
    invalid_requested = sorted([skill for skill in requested if skill not in allowed_set])

    objective_present = any(str(item.get("type")) == "Objective" for item in selected_items)
    plan_present = any(str(item.get("type")) == "Plan" for item in selected_items)
    anchors_passed = objective_present and plan_present
    budget_passed = token_estimate <= token_budget
    phase_rights_passed = not invalid_requested

    failed_checks: list[str] = []
    if not budget_passed:
        failed_checks.append(
            f"token budget exceeded ({token_estimate} > {token_budget})"
        )
    if not objective_present:
        failed_checks.append("missing required objective anchor")
    if not plan_present:
        failed_checks.append("missing required plan anchor")
    if not phase_rights_passed:
        failed_checks.append(
            "requested skills not allowed in phase "
            f"{phase}: {', '.join(invalid_requested)}"
        )

    return {
        "passed": not failed_checks,
        "failed_checks": failed_checks,
        "checks": {
            "budget": {
                "passed": budget_passed,
                "token_estimate": token_estimate,
                "token_budget": token_budget,
            },
            "anchors": {
                "passed": anchors_passed,
                "objective_present": objective_present,
                "plan_present": plan_present,
            },
            "phase_rights": {
                "passed": phase_rights_passed,
                "phase": phase,
                "requested_skills": requested,
                "invalid_skills": invalid_requested,
                "allowed_skills": allowed,
            },
        },
    }


class ContextCompiler:
    def __init__(
        self,
        graph_store: GraphStore | None = None,
        artifact_store: ArtifactStore | None = None,
        mock_mode: bool | None = None,
    ) -> None:
        if mock_mode is None:
            mock_mode = os.getenv("CEW_MOCK_AWS", "0") == "1"
        self.mock_mode = mock_mode
        self.graph = graph_store or GraphStore(mock_mode=mock_mode)
        self.artifacts = artifact_store or ArtifactStore(mock_mode=mock_mode)
        self.region = os.getenv("AWS_REGION") or os.getenv("AWS_DEFAULT_REGION")

    # Backward-compatible deterministic compile path used by existing skill.
    def compile(
        self,
        run_id: str,
        nodes: list[dict[str, Any]],
        edges: list[dict[str, Any]],
        max_items: int,
        byte_budget: int,
    ) -> dict[str, Any]:
        candidates: list[dict[str, Any]] = []

        for node in nodes:
            candidates.append(
                {
                    "kind": "node",
                    "id": node.get("node_id", ""),
                    "type": node.get("node_type", ""),
                    "payload": _json_safe(node.get("payload", {})),
                }
            )
        for edge in edges:
            candidates.append(
                {
                    "kind": "edge",
                    "id": edge.get("edge_id", ""),
                    "type": edge.get("edge_type", ""),
                    "from_id": edge.get("from_id", ""),
                    "to_id": edge.get("to_id", ""),
                }
            )

        ranked = sorted(candidates, key=lambda item: (item["kind"], item["type"], item["id"]))

        packed: list[dict[str, Any]] = []
        used_bytes = 0
        for item in ranked:
            encoded = json.dumps(item, sort_keys=True).encode("utf-8")
            if len(packed) >= max_items:
                break
            if used_bytes + len(encoded) > byte_budget:
                continue
            packed.append(item)
            used_bytes += len(encoded)

        dropped_count = len(ranked) - len(packed)
        pack_fingerprint = hashlib.sha256(
            json.dumps(packed, sort_keys=True).encode("utf-8")
        ).hexdigest()[:16]

        return {
            "pack_id": f"pack-{run_id}-{pack_fingerprint}",
            "items": packed,
            "used_bytes": used_bytes,
            "dropped_count": dropped_count,
        }

    def compile_context_pack(
        self,
        session_id: str,
        task: str,
        strategy: str,
        phase: str,
        token_budget: int,
        recite_receipt_limit: int = 5,
        recite_verify_limit: int = 3,
        attempt_compaction: bool = True,
    ) -> dict[str, Any]:
        session_graph = self.graph.list_session(session_id)
        nodes = session_graph.get("nodes", [])
        edges = session_graph.get("edges", [])

        strategy_key = strategy.strip().lower()
        if strategy_key == "recite":
            selected_items = self._compile_recite(
                nodes=nodes,
                edges=edges,
                task=task,
                receipt_limit=recite_receipt_limit,
                verify_limit=recite_verify_limit,
            )
        elif strategy_key == "graph_first":
            selected_items = self._compile_graph_first(
                nodes=nodes,
                edges=edges,
                task=task,
                token_budget=token_budget,
            )
        else:
            raise ValueError("Unknown strategy. Use 'recite' or 'graph_first'.")

        if strategy_key == "recite":
            selected_items = self._enforce_token_budget(selected_items, token_budget)

        compaction = self._maybe_compact(
            session_id=session_id,
            nodes=nodes,
            selected_items=selected_items,
            attempt_compaction=attempt_compaction,
        )

        allowed_skills = self._allowed_skills_for_phase(phase)
        total_tokens = sum(int(item.get("token_estimate", 0)) for item in selected_items)

        pack_payload = {
            "session_id": session_id,
            "strategy": strategy_key,
            "task": task,
            "phase": phase,
            "selected_items": selected_items,
            "allowed_skills": allowed_skills,
            "token_estimate": total_tokens,
            "token_budget": token_budget,
            "compaction": compaction,
            "generated_at": datetime.now(timezone.utc).isoformat(),
        }
        return pack_payload

    def assemble_context_view_agent(
        self,
        session_id: str,
        task: str,
        phase: str,
        token_budget: int,
        retrieval_hints: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        hints = retrieval_hints if isinstance(retrieval_hints, dict) else {}
        session_graph = self.graph.list_session(session_id)
        nodes = session_graph.get("nodes", [])

        filtered_nodes = self._filter_nodes_for_agent_assembly(
            nodes=nodes,
            task=task,
            retrieval_hints=hints,
        )

        selected_items: list[dict[str, Any]] = []
        used_tokens = 0
        for node in filtered_nodes:
            linked = self._linked_to_task(node, task)
            factors = [
                "validated" if bool(node.get("validated")) else "unvalidated",
                "linked-to-task" if linked else "unlinked",
                f"type-priority:{TYPE_PRIORITY.get(self._node_type(node), 30)}",
                f"recent:{self._node_timestamp(node).isoformat()}",
            ]
            if hints.get("query"):
                factors.append("query-matched")

            item = self._build_item(
                node=node,
                reason="AGENT_ASSEMBLY: " + ", ".join(factors),
                linked_to_task=linked,
            )
            cost = int(item.get("token_estimate", 0))
            if used_tokens + cost > token_budget:
                continue
            selected_items.append(item)
            used_tokens += cost

        sorted_nodes = sorted(nodes, key=self._node_timestamp, reverse=True)
        objective_item = self._latest_or_synthetic_objective(sorted_nodes, task)
        plan_item = self._latest_or_synthetic_plan(sorted_nodes)
        selected_items = self._ensure_anchor_item(selected_items, objective_item, token_budget)
        selected_items = self._ensure_anchor_item(selected_items, plan_item, token_budget)

        token_estimate = sum(int(item.get("token_estimate", 0)) for item in selected_items)
        requested_skills_raw = hints.get("requested_skills")
        requested_skills = (
            [str(skill) for skill in requested_skills_raw]
            if isinstance(requested_skills_raw, list)
            else []
        )
        policy_checks = evaluate_assembly_policy_checks(
            selected_items=selected_items,
            token_estimate=token_estimate,
            token_budget=token_budget,
            phase=phase,
            requested_skills=requested_skills,
        )

        return {
            "selected_items": selected_items,
            "token_estimate": token_estimate,
            "policy_checks": policy_checks,
            "retrieval_provenance": {
                "query": hints.get("query"),
                "types": hints.get("types"),
                "validated_only": bool(hints.get("validated_only")) if "validated_only" in hints else False,
                "candidate_count": len(filtered_nodes),
            },
        }

    def _compile_recite(
        self,
        nodes: list[dict[str, Any]],
        edges: list[dict[str, Any]],
        task: str,
        receipt_limit: int,
        verify_limit: int,
    ) -> list[dict[str, Any]]:
        del edges  # strategy does not need edges directly for MVP.
        sorted_nodes = sorted(nodes, key=self._node_timestamp, reverse=True)

        receipts = [node for node in sorted_nodes if self._node_type(node) == "Receipt"]
        receipts = sorted(
            receipts,
            key=lambda node: (
                1 if bool(node.get("validated")) else 0,
                self._node_timestamp(node).timestamp(),
            ),
            reverse=True,
        )[:receipt_limit]

        verify_nodes: list[dict[str, Any]] = []
        for node in sorted_nodes:
            if self._node_type(node) not in {"Receipt", "Artifact", "TestResult", "Summary"}:
                continue
            payload = self._node_payload(node)
            blob = json.dumps(payload, sort_keys=True).lower()
            if any(
                token in blob
                for token in [
                    "verify",
                    "verification",
                    "compile_context_pack",
                    "summarize_evidence",
                    "write_receipt",
                ]
            ):
                verify_nodes.append(node)
            if len(verify_nodes) >= verify_limit:
                break

        selected_nodes: list[dict[str, Any]] = []
        seen: set[str] = set()
        reason_by_id: dict[str, str] = {}

        def push(node: dict[str, Any], reason: str) -> None:
            node_id = self._node_id(node)
            if not node_id:
                return
            if node_id not in seen:
                selected_nodes.append(node)
                seen.add(node_id)
                reason_by_id[node_id] = reason
                return
            if "verification evidence window" in reason and "verification evidence window" not in reason_by_id.get(
                node_id, ""
            ):
                reason_by_id[node_id] = reason

        for node in receipts:
            tier = "validated-promoted" if node.get("validated") else "unvalidated-fallback"
            push(node, f"RECITE: included from latest receipts window ({tier}).")
        for node in verify_nodes:
            tier = "validated-promoted" if node.get("validated") else "unvalidated-fallback"
            push(node, f"RECITE: included from verification evidence window ({tier}).")

        selected_items = [
            self._build_item(
                node,
                reason_by_id.get(self._node_id(node), "RECITE: selected."),
                linked_to_task=self._linked_to_task(node, task),
            )
            for node in selected_nodes
        ]

        objective_item = self._latest_or_synthetic_objective(sorted_nodes, task)
        latest_plan_item = self._latest_or_synthetic_plan(sorted_nodes)

        # Recency placement requirement: objective + latest plan are appended at the end.
        selected_items = [
            item
            for item in selected_items
            if item.get("id") not in {objective_item.get("id"), latest_plan_item.get("id")}
        ]
        selected_items.append(objective_item)
        selected_items.append(latest_plan_item)
        return selected_items

    def _compile_graph_first(
        self,
        nodes: list[dict[str, Any]],
        edges: list[dict[str, Any]],
        task: str,
        token_budget: int,
    ) -> list[dict[str, Any]]:
        node_by_id = {self._node_id(node): node for node in nodes if self._node_id(node)}
        adjacency: dict[str, set[str]] = {node_id: set() for node_id in node_by_id.keys()}

        for edge in edges:
            from_id = edge.get("from_id")
            to_id = edge.get("to_id")
            if from_id in adjacency and to_id in node_by_id:
                adjacency[from_id].add(str(to_id))
            if to_id in adjacency and from_id in node_by_id:
                adjacency[str(to_id)].add(str(from_id))

        seed_ids: list[str] = []
        for node in nodes:
            node_id = self._node_id(node)
            if not node_id:
                continue
            node_type = self._node_type(node)
            if node_type in {"Task", "Objective"}:
                seed_ids.append(node_id)
                continue
            if self._linked_to_task(node, task):
                seed_ids.append(node_id)

        if not seed_ids:
            sorted_nodes = sorted(nodes, key=self._node_timestamp, reverse=True)
            seed_ids = [self._node_id(node) for node in sorted_nodes[:3] if self._node_id(node)]

        visited: dict[str, int] = {}
        queue: deque[tuple[str, int]] = deque()

        for seed in seed_ids:
            if seed and seed in node_by_id:
                queue.append((seed, 0))
                visited[seed] = 0

        while queue:
            current, depth = queue.popleft()
            if depth >= 2:
                continue
            for neighbor in adjacency.get(current, set()):
                if neighbor not in visited or visited[neighbor] > depth + 1:
                    visited[neighbor] = depth + 1
                    queue.append((neighbor, depth + 1))

        candidate_ids = list(visited.keys()) if visited else list(node_by_id.keys())

        ranked_nodes = sorted(
            [node_by_id[node_id] for node_id in candidate_ids if node_id in node_by_id],
            key=lambda node: (
                1 if bool(node.get("validated")) else 0,
                1 if self._linked_to_task(node, task) else 0,
                self._node_timestamp(node).timestamp(),
                TYPE_PRIORITY.get(self._node_type(node), 30),
            ),
            reverse=True,
        )

        selected_items: list[dict[str, Any]] = []
        used_tokens = 0
        for node in ranked_nodes:
            factors = []
            if node.get("validated"):
                factors.append("validated")
            else:
                factors.append("unvalidated")

            if self._linked_to_task(node, task):
                factors.append("linked-to-task")
            else:
                factors.append("unlinked")

            factors.append(f"recent:{self._node_timestamp(node).isoformat()}")
            factors.append(f"type-priority:{TYPE_PRIORITY.get(self._node_type(node), 30)}")

            item = self._build_item(
                node,
                "GRAPH_FIRST: " + ", ".join(factors),
                linked_to_task=self._linked_to_task(node, task),
            )
            token_cost = int(item["token_estimate"])
            if used_tokens + token_cost > token_budget:
                continue
            selected_items.append(item)
            used_tokens += token_cost

        if not any(item.get("type") == "Objective" for item in selected_items):
            selected_items.append(self._synthetic_objective_item(task))
            selected_items = self._enforce_token_budget(selected_items, token_budget)

        return selected_items

    def _maybe_compact(
        self,
        session_id: str,
        nodes: list[dict[str, Any]],
        selected_items: list[dict[str, Any]],
        attempt_compaction: bool,
    ) -> dict[str, Any]:
        if not attempt_compaction:
            return {"performed": False, "message": "Compaction disabled."}

        selected_ids = {str(item.get("id")) for item in selected_items if item.get("id")}
        receipts = [node for node in nodes if self._node_type(node) == "Receipt"]
        receipts = sorted(receipts, key=self._node_timestamp, reverse=True)
        older_receipts = [node for node in receipts if self._node_id(node) not in selected_ids]

        if len(older_receipts) < 2:
            return {"performed": False, "message": "Not enough older receipts to compact."}

        if not self._bedrock_available():
            return {"performed": False, "message": "Bedrock unavailable; compaction skipped."}

        receipt_lines: list[str] = []
        for node in older_receipts[:40]:
            payload = self._node_payload(node)
            ts = str(payload.get("ts_utc") or self._node_timestamp(node).isoformat())
            summary_text = str(payload.get("summary") or "(no summary)")
            receipt_lines.append(f"- {ts} | {summary_text}")

        prompt = "Summarize these historical receipts into a compact operations summary:\n" + "\n".join(
            receipt_lines
        )

        try:
            summary_text = summarize_with_bedrock(prompt, max_chars=1600)
        except Exception as exc:
            return {
                "performed": False,
                "message": f"Bedrock compaction failed and was skipped: {exc}",
            }

        if not summary_text.strip():
            summary_text = summarize("\n".join(receipt_lines), max_chars=1200)

        uploaded = self.artifacts.upload_artifact(
            session_id=session_id,
            name="receipt-compaction-summary.txt",
            content_bytes=summary_text.encode("utf-8"),
        )

        artifact_id = self.graph.put_node(
            type="Artifact",
            data={
                "name": "receipt-compaction-summary.txt",
                "s3_uri": uploaded["s3_uri"],
                "sha256": uploaded["sha256"],
                "bytes": uploaded["bytes"],
            },
            session_id=session_id,
            validated=True,
            artifact_ref=str(uploaded["s3_uri"]),
        )

        summary_node_id = self.graph.put_node(
            type="Summary",
            data={
                "summary": summary_text,
                "ts_utc": datetime.now(timezone.utc).isoformat(),
                "source_receipt_count": len(older_receipts),
                "s3_uri": uploaded["s3_uri"],
            },
            session_id=session_id,
            validated=True,
            artifact_ref=str(uploaded["s3_uri"]),
        )

        self.graph.put_edge(
            from_id=summary_node_id,
            edge_type="references",
            to_id=artifact_id,
            session_id=session_id,
        )

        for node in older_receipts[:20]:
            receipt_id = self._node_id(node)
            if not receipt_id:
                continue
            self.graph.put_edge(
                from_id=summary_node_id,
                edge_type="summarizes",
                to_id=receipt_id,
                session_id=session_id,
            )

        return {
            "performed": True,
            "message": "Compacted older receipts into Summary node.",
            "summary_node_id": summary_node_id,
            "summary_artifact_uri": uploaded["s3_uri"],
            "source_receipt_count": len(older_receipts),
        }

    def _bedrock_available(self) -> bool:
        if not (os.getenv("BEDROCK_ENABLED", "0").lower() in {"1", "true", "yes", "on"}):
            return False
        if self.mock_mode:
            return False
        if not self.region:
            return False
        try:
            client = boto3.client("bedrock", region_name=self.region)
            client.list_foundation_models(byOutputModality="TEXT")
            return True
        except ClientError:
            return False
        except Exception:
            return False

    def _allowed_skills_for_phase(self, phase: str) -> list[str]:
        return allowed_skills_for_phase(phase)

    def _filter_nodes_for_agent_assembly(
        self,
        nodes: list[dict[str, Any]],
        task: str,
        retrieval_hints: dict[str, Any],
    ) -> list[dict[str, Any]]:
        query = str(retrieval_hints.get("query") or "").strip().lower()
        types_raw = retrieval_hints.get("types")
        type_filter = {str(node_type) for node_type in types_raw} if isinstance(types_raw, list) else None
        validated_only = bool(retrieval_hints.get("validated_only")) if "validated_only" in retrieval_hints else False
        limit_raw = retrieval_hints.get("limit")
        limit = int(limit_raw) if isinstance(limit_raw, int) and limit_raw > 0 else 80

        def matches(node: dict[str, Any]) -> bool:
            if type_filter is not None and self._node_type(node) not in type_filter:
                return False
            if validated_only and not bool(node.get("validated")):
                return False
            if not query:
                return True
            blob = json.dumps(
                {
                    "type": self._node_type(node),
                    "payload": self._node_payload(node),
                },
                sort_keys=True,
                default=str,
            ).lower()
            terms = [term for term in query.split() if len(term) >= 3]
            if not terms:
                return query in blob
            return any(term in blob for term in terms)

        filtered = [node for node in nodes if matches(node)]
        filtered.sort(
            key=lambda node: (
                1 if self._linked_to_task(node, task) else 0,
                1 if bool(node.get("validated")) else 0,
                self._node_timestamp(node).timestamp(),
                TYPE_PRIORITY.get(self._node_type(node), 30),
            ),
            reverse=True,
        )
        return filtered[:limit]

    def _ensure_anchor_item(
        self,
        selected_items: list[dict[str, Any]],
        anchor_item: dict[str, Any],
        token_budget: int,
    ) -> list[dict[str, Any]]:
        anchor_type = str(anchor_item.get("type"))
        if any(str(item.get("type")) == anchor_type for item in selected_items):
            return selected_items

        out = list(selected_items)
        total = sum(int(item.get("token_estimate", 0)) for item in out)
        anchor_cost = int(anchor_item.get("token_estimate", 0))

        while out and total + anchor_cost > token_budget:
            drop_idx = -1
            for idx in range(len(out) - 1, -1, -1):
                if str(out[idx].get("type")) in {"Objective", "Plan"}:
                    continue
                drop_idx = idx
                break
            if drop_idx == -1:
                break
            dropped = out.pop(drop_idx)
            total -= int(dropped.get("token_estimate", 0))

        if total + anchor_cost <= token_budget:
            out.append(anchor_item)
        return out

    def _node_type(self, node: dict[str, Any]) -> str:
        value = node.get("type") or node.get("node_type") or "Unknown"
        return str(value)

    def _node_id(self, node: dict[str, Any]) -> str:
        value = node.get("node_id")
        return str(value) if value is not None else ""

    def _node_payload(self, node: dict[str, Any]) -> dict[str, Any]:
        payload = node.get("data") if isinstance(node.get("data"), dict) else node.get("payload")
        if not isinstance(payload, dict):
            return {}
        return _json_safe(payload)

    def _node_timestamp(self, node: dict[str, Any]) -> datetime:
        payload = self._node_payload(node)
        candidates = [
            node.get("updated_at"),
            node.get("created_at"),
            payload.get("ts_utc"),
            payload.get("finished_at"),
            payload.get("started_at"),
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

    def _linked_to_task(self, node: dict[str, Any], task: str) -> bool:
        task = task.strip().lower()
        if not task:
            return False
        text = json.dumps(
            {
                "type": self._node_type(node),
                "payload": self._node_payload(node),
            },
            sort_keys=True,
            default=str,
        ).lower()
        terms = [term for term in task.split() if len(term) >= 3]
        if not terms:
            return task in text
        return any(term in text for term in terms)

    def _compact_payload(self, payload: dict[str, Any]) -> dict[str, Any]:
        compact: dict[str, Any] = {}
        for key, value in payload.items():
            key_lower = str(key).lower()
            if key_lower in {"content", "stdout", "stderr", "inputs"}:
                compact[str(key)] = "<omitted-large-field>"
                continue
            if isinstance(value, str):
                compact[str(key)] = value if len(value) <= 180 else value[:177] + "..."
                continue
            compact[str(key)] = value
        return compact

    def _build_item(self, node: dict[str, Any], reason: str, linked_to_task: bool) -> dict[str, Any]:
        node_id = self._node_id(node)
        node_type = self._node_type(node)
        payload = self._node_payload(node)

        item: dict[str, Any] = {
            "id": node_id,
            "type": node_type,
            "validated": bool(node.get("validated")),
            "linked_to_task": linked_to_task,
            "selection_reason": reason,
            "ts_utc": self._node_timestamp(node).isoformat(),
        }

        if node_type == "Artifact":
            item["summary"] = str(payload.get("name") or "Artifact pointer")
            if "s3_uri" in payload:
                item["s3_uri"] = payload.get("s3_uri")
            if "sha256" in payload:
                item["sha256"] = payload.get("sha256")
            if "bytes" in payload:
                item["bytes"] = payload.get("bytes")
        elif node_type == "Receipt":
            item["summary"] = str(payload.get("summary") or "Receipt")
            item["status"] = payload.get("status")
            if payload.get("artifact_uri"):
                item["artifact_uri"] = payload.get("artifact_uri")
        elif node_type == "SkillCall":
            item["summary"] = str(payload.get("skill_name") or "SkillCall")
            item["exit_code"] = payload.get("exit_code")
            item["finished_at"] = payload.get("finished_at")
        elif node_type == "Summary":
            text = str(payload.get("summary") or "")
            item["summary"] = text if len(text) <= 280 else text[:277] + "..."
            if payload.get("s3_uri"):
                item["s3_uri"] = payload.get("s3_uri")
        else:
            item["summary"] = json.dumps(self._compact_payload(payload), sort_keys=True, default=str)

        token_payload = json.dumps(item, sort_keys=True, default=str)
        item["token_estimate"] = max(1, math.ceil(len(token_payload) / 4))
        return item

    def _synthetic_objective_item(self, task: str) -> dict[str, Any]:
        summary = task.strip() or "No explicit objective provided."
        item: dict[str, Any] = {
            "id": "synthetic-objective",
            "type": "Objective",
            "validated": True,
            "linked_to_task": True,
            "summary": summary,
            "selection_reason": "Strategy requirement: include Objective in final context pack.",
            "ts_utc": datetime.now(timezone.utc).isoformat(),
        }
        item["token_estimate"] = max(1, math.ceil(len(json.dumps(item, sort_keys=True)) / 4))
        return item

    def _latest_or_synthetic_objective(
        self,
        sorted_nodes: list[dict[str, Any]],
        task: str,
    ) -> dict[str, Any]:
        for node in sorted_nodes:
            if self._node_type(node) == "Objective":
                return self._build_item(
                    node,
                    "RECITE: objective retained at end for recency placement.",
                    linked_to_task=True,
                )
        return self._synthetic_objective_item(task)

    def _latest_or_synthetic_plan(self, sorted_nodes: list[dict[str, Any]]) -> dict[str, Any]:
        for node in sorted_nodes:
            if self._node_type(node) == "Plan":
                return self._build_item(
                    node,
                    "RECITE: latest plan retained at end for recency placement.",
                    linked_to_task=True,
                )

        for node in sorted_nodes:
            if self._node_type(node) == "SkillCall":
                payload = self._node_payload(node)
                inferred = {
                    "id": "synthetic-latest-plan",
                    "type": "Plan",
                    "validated": bool(node.get("validated")),
                    "linked_to_task": True,
                    "summary": (
                        "No explicit Plan node found. Inferred latest plan step from skill "
                        f"'{payload.get('skill_name', 'unknown')}'."
                    ),
                    "selection_reason": "RECITE: latest plan required; inferred from latest SkillCall.",
                    "ts_utc": self._node_timestamp(node).isoformat(),
                }
                inferred["token_estimate"] = max(1, math.ceil(len(json.dumps(inferred, sort_keys=True)) / 4))
                return inferred

        item = {
            "id": "synthetic-latest-plan",
            "type": "Plan",
            "validated": False,
            "linked_to_task": True,
            "summary": "No explicit plan found in graph yet.",
            "selection_reason": "RECITE: latest plan required; synthetic placeholder used.",
            "ts_utc": datetime.now(timezone.utc).isoformat(),
        }
        item["token_estimate"] = max(1, math.ceil(len(json.dumps(item, sort_keys=True)) / 4))
        return item

    def _enforce_token_budget(self, items: list[dict[str, Any]], token_budget: int) -> list[dict[str, Any]]:
        selected: list[dict[str, Any]] = []
        used = 0
        for item in items:
            cost = int(item.get("token_estimate", 0))
            if used + cost > token_budget:
                continue
            selected.append(item)
            used += cost
        return selected
