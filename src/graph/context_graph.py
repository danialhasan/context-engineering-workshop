"""Graph storage backed by DynamoDB GraphNodes/GraphEdges or local mock JSON."""

from __future__ import annotations

import json
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import boto3
from boto3.dynamodb.conditions import Attr
from botocore.exceptions import ClientError

from src.graph.ontology import (
    validate_edge_type,
    validate_edge_write,
    validate_node_type,
    validate_node_write,
)


class MissingTableError(RuntimeError):
    """Raised when required GraphNodes/GraphEdges tables are missing."""


class GraphStore:
    """Thin graph persistence layer for workshop primitives."""

    def __init__(self, mock_mode: bool | None = None, region_name: str | None = None) -> None:
        if mock_mode is None:
            mock_mode = os.getenv("CEW_MOCK_AWS", "0") == "1"
        self.mock_mode = mock_mode
        self.region_name = region_name or os.getenv("AWS_REGION") or os.getenv("AWS_DEFAULT_REGION")

        self.nodes_table_name = os.getenv("CEW_GRAPH_NODES_TABLE", "GraphNodes")
        self.edges_table_name = os.getenv("CEW_GRAPH_EDGES_TABLE", "GraphEdges")

        self.mock_file = Path("logs/mock_graph.json")
        self.mock_file.parent.mkdir(parents=True, exist_ok=True)

        self._ddb_client = None if self.mock_mode else boto3.client("dynamodb", region_name=self.region_name)
        self._ddb_resource = None if self.mock_mode else boto3.resource("dynamodb", region_name=self.region_name)

    def _load_mock(self) -> dict[str, Any]:
        if not self.mock_file.exists():
            return {"nodes": [], "edges": []}
        return json.loads(self.mock_file.read_text(encoding="utf-8"))

    def _save_mock(self, data: dict[str, Any]) -> None:
        self.mock_file.write_text(json.dumps(data, indent=2), encoding="utf-8")

    def _missing_table_message(self, table_name: str) -> str:
        return (
            f"DynamoDB table '{table_name}' is missing. "
            "Workshop accounts must pre-provision GraphNodes and GraphEdges. "
            "Create the missing table with a string partition key "
            f"('{ 'node_id' if table_name == self.nodes_table_name else 'edge_id' }') "
            "and grant read/write permissions before retrying."
        )

    def ensure_tables_exist(self) -> None:
        if self.mock_mode:
            return

        assert self._ddb_client is not None
        for table_name in (self.nodes_table_name, self.edges_table_name):
            try:
                self._ddb_client.describe_table(TableName=table_name)
            except ClientError as exc:
                code = exc.response.get("Error", {}).get("Code", "")
                if code == "ResourceNotFoundException":
                    raise MissingTableError(self._missing_table_message(table_name)) from exc
                raise

    def put_node(
        self,
        type: str,
        data: dict[str, Any],
        session_id: str,
        validated: bool = False,
        artifact_ref: str | None = None,
        node_id: str | None = None,
    ) -> str:
        """Store a graph node and return node_id."""
        validate_node_write(type, data)
        node_id = node_id or f"node-{uuid.uuid4().hex[:12]}"
        now = datetime.now(timezone.utc).isoformat()

        node = {
            "node_id": node_id,
            "type": type,
            "data": data,
            "session_id": session_id,
            "validated": validated,
            "artifact_ref": artifact_ref,
            "created_at": now,
            "updated_at": now,
        }

        if self.mock_mode:
            graph = self._load_mock()
            for idx, existing in enumerate(graph["nodes"]):
                if existing.get("node_id") == node_id:
                    node["created_at"] = existing.get("created_at", now)
                    graph["nodes"][idx] = node
                    self._save_mock(graph)
                    return node_id
            graph["nodes"].append(node)
            self._save_mock(graph)
            return node_id

        self.ensure_tables_exist()
        assert self._ddb_resource is not None
        table = self._ddb_resource.Table(self.nodes_table_name)
        table.put_item(Item=node)
        return node_id

    def put_edge(
        self,
        from_id: str,
        edge_type: str,
        to_id: str,
        session_id: str,
        edge_id: str | None = None,
    ) -> str:
        """Store an edge and return edge_id."""
        from_node = self.get_node(from_id)
        to_node = self.get_node(to_id)
        from_type = str(from_node.get("type")) if isinstance(from_node, dict) and from_node.get("type") else None
        to_type = str(to_node.get("type")) if isinstance(to_node, dict) and to_node.get("type") else None
        validate_edge_write(edge_type=edge_type, from_type=from_type, to_type=to_type)

        edge_id = edge_id or f"edge-{uuid.uuid4().hex[:12]}"
        edge = {
            "edge_id": edge_id,
            "from_id": from_id,
            "to_id": to_id,
            "edge_type": edge_type,
            "session_id": session_id,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }

        if self.mock_mode:
            graph = self._load_mock()
            graph["edges"].append(edge)
            self._save_mock(graph)
            return edge_id

        self.ensure_tables_exist()
        assert self._ddb_resource is not None
        table = self._ddb_resource.Table(self.edges_table_name)
        table.put_item(Item=edge)
        return edge_id

    def get_node(self, node_id: str) -> dict[str, Any] | None:
        if self.mock_mode:
            graph = self._load_mock()
            for node in graph["nodes"]:
                if node.get("node_id") == node_id:
                    return node
            return None

        self.ensure_tables_exist()
        assert self._ddb_resource is not None
        table = self._ddb_resource.Table(self.nodes_table_name)
        response = table.get_item(Key={"node_id": node_id})
        return response.get("Item")

    def neighbors(self, from_id: str) -> list[dict[str, Any]]:
        if self.mock_mode:
            graph = self._load_mock()
            return [edge for edge in graph["edges"] if edge.get("from_id") == from_id]

        self.ensure_tables_exist()
        assert self._ddb_resource is not None
        table = self._ddb_resource.Table(self.edges_table_name)
        response = table.scan(FilterExpression=Attr("from_id").eq(from_id))
        return response.get("Items", [])

    def reverse_neighbors(self, to_id: str) -> list[dict[str, Any]]:
        if self.mock_mode:
            graph = self._load_mock()
            return [edge for edge in graph["edges"] if edge.get("to_id") == to_id]

        self.ensure_tables_exist()
        assert self._ddb_resource is not None
        table = self._ddb_resource.Table(self.edges_table_name)
        response = table.scan(FilterExpression=Attr("to_id").eq(to_id))
        return response.get("Items", [])

    def list_session(self, session_id: str) -> dict[str, list[dict[str, Any]]]:
        """Return all nodes/edges for a session."""
        if self.mock_mode:
            graph = self._load_mock()
            nodes = [node for node in graph["nodes"] if node.get("session_id") == session_id]
            edges = [edge for edge in graph["edges"] if edge.get("session_id") == session_id]
            return {"nodes": nodes, "edges": edges}

        self.ensure_tables_exist()
        assert self._ddb_resource is not None

        nodes_table = self._ddb_resource.Table(self.nodes_table_name)
        edges_table = self._ddb_resource.Table(self.edges_table_name)

        nodes_resp = nodes_table.scan(FilterExpression=Attr("session_id").eq(session_id))
        edges_resp = edges_table.scan(FilterExpression=Attr("session_id").eq(session_id))
        return {
            "nodes": nodes_resp.get("Items", []),
            "edges": edges_resp.get("Items", []),
        }

    # Backward-compatible wrappers used by existing orchestration flow.
    def upsert_node(
        self,
        run_id: str,
        node_type: str,
        node_id: str,
        payload: dict[str, Any],
    ) -> dict[str, Any]:
        validate_node_type(node_type)
        existing = self.get_node(node_id)
        version = int(existing.get("data", {}).get("version", 0)) + 1 if existing else 1
        payload_with_version = {**payload, "version": version}
        self.put_node(
            type=node_type,
            data=payload_with_version,
            session_id=run_id,
            validated=True,
            node_id=node_id,
        )
        return {
            "run_id": run_id,
            "node_id": node_id,
            "node_type": node_type,
            "payload": payload_with_version,
            "version": version,
        }

    def list_run(self, run_id: str) -> dict[str, list[dict[str, Any]]]:
        session = self.list_session(run_id)
        nodes: list[dict[str, Any]] = []
        for raw_node in session["nodes"]:
            if raw_node.get("type") in {"Run", "SkillExecution", "Receipt", "Artifact", "Claim"}:
                nodes.append(
                    {
                        "run_id": raw_node.get("session_id"),
                        "node_id": raw_node.get("node_id"),
                        "node_type": raw_node.get("type"),
                        "payload": raw_node.get("data", {}),
                        "version": raw_node.get("data", {}).get("version", 1),
                    }
                )

        edges: list[dict[str, Any]] = []
        for raw_edge in session["edges"]:
            edge_type = raw_edge.get("edge_type")
            if edge_type in {
                "RUN_HAS_STEP",
                "STEP_EMITS_RECEIPT",
                "RECEIPT_POINTS_TO",
                "CLAIM_SUPPORTED_BY",
                "RUN_ASSERTS",
            }:
                edges.append(
                    {
                        "run_id": raw_edge.get("session_id"),
                        "edge_id": raw_edge.get("edge_id"),
                        "from_id": raw_edge.get("from_id"),
                        "to_id": raw_edge.get("to_id"),
                        "edge_type": edge_type,
                    }
                )

        return {"nodes": nodes, "edges": edges}

    def put_checked_edge(
        self,
        run_id: str,
        from_id: str,
        to_id: str,
        edge_type: str,
    ) -> dict[str, Any]:
        validate_edge_type(edge_type)
        edge_id = self.put_edge(
            from_id=from_id,
            edge_type=edge_type,
            to_id=to_id,
            session_id=run_id,
        )
        return {
            "run_id": run_id,
            "edge_id": edge_id,
            "from_id": from_id,
            "to_id": to_id,
            "edge_type": edge_type,
        }
