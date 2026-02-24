"""Fast environment doctor with fail-fast remediation guidance."""

from __future__ import annotations

import os
import shutil
import sys
import uuid
from dataclasses import dataclass

import boto3
from botocore.exceptions import ClientError, NoCredentialsError, NoRegionError

from src.artifacts.store import ArtifactStore
from src.graph.context_graph import GraphStore, MissingTableError


@dataclass
class CheckFailure(Exception):
    message: str
    remediation: str


def _is_truthy(value: str | None) -> bool:
    return str(value).lower() in {"1", "true", "yes", "on"}


def _fail(message: str, remediation: str) -> None:
    raise CheckFailure(message=message, remediation=remediation)


def _check_python() -> None:
    if sys.version_info < (3, 10):
        _fail(
            "Python 3.10+ is required.",
            "Install Python 3.10+ and re-run `make install`.",
        )


def _check_aws_cli() -> None:
    if shutil.which("aws") is None:
        _fail(
            "AWS CLI is not installed or not on PATH.",
            "Install AWS CLI v2 and ensure `aws --version` works.",
        )


def _check_region() -> str:
    region = os.getenv("AWS_REGION") or os.getenv("AWS_DEFAULT_REGION")
    if not region:
        region = boto3.session.Session().region_name
    if not region:
        _fail(
            "AWS region is not configured.",
            "Set `AWS_REGION` (example: `export AWS_REGION=us-east-1`) or run `aws configure set region us-east-1`.",
        )
    os.environ.setdefault("AWS_REGION", region)
    return region


def _check_identity(region: str) -> dict[str, str]:
    os.environ.setdefault("AWS_EC2_METADATA_DISABLED", "true")
    try:
        sts = boto3.client("sts", region_name=region)
        identity = sts.get_caller_identity()
    except NoCredentialsError as exc:
        _fail(
            "AWS credentials were not found.",
            "Run `aws configure` or export `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, and session token if needed.",
        )
        raise AssertionError from exc
    except NoRegionError as exc:
        _fail(
            "AWS SDK could not determine a region.",
            "Set `AWS_REGION` or `AWS_DEFAULT_REGION` and retry.",
        )
        raise AssertionError from exc
    except ClientError as exc:
        _fail(
            f"STS identity check failed: {exc.response.get('Error', {}).get('Message', str(exc))}",
            "Verify active credentials and role permissions for `sts:GetCallerIdentity`.",
        )
        raise AssertionError from exc
    return {
        "account_id": identity.get("Account", ""),
        "arn": identity.get("Arn", ""),
    }


def _check_graph_roundtrip(region: str) -> tuple[str, str]:
    graph = GraphStore(mock_mode=False, region_name=region)

    try:
        graph.ensure_tables_exist()
    except MissingTableError as exc:
        _fail(
            str(exc),
            "Provision GraphNodes and GraphEdges in the workshop account and grant DynamoDB read/write permissions.",
        )

    session_id = f"doctor-{uuid.uuid4().hex[:8]}"
    node_id = graph.put_node(
        type="DoctorProbe",
        data={"probe": "graph-roundtrip"},
        session_id=session_id,
        validated=True,
    )
    read_back = graph.get_node(node_id)
    if not read_back:
        _fail(
            "GraphNodes write/read round-trip failed.",
            "Confirm GraphNodes table key schema uses `node_id` as string partition key.",
        )

    edge_id = graph.put_edge(
        from_id=node_id,
        edge_type="doctor_probe",
        to_id=node_id,
        session_id=session_id,
    )
    neighbor_ids = {edge.get("edge_id") for edge in graph.neighbors(node_id)}
    if edge_id not in neighbor_ids:
        _fail(
            "GraphEdges write/read round-trip failed.",
            "Confirm GraphEdges table includes `edge_id`, `from_id`, and `to_id` attributes and permits scan/read.",
        )

    return graph.nodes_table_name, graph.edges_table_name


def _check_s3_write(region: str) -> tuple[str, str]:
    bucket = os.getenv("CEW_ARTIFACT_BUCKET")
    if not bucket:
        _fail(
            "CEW_ARTIFACT_BUCKET is not set.",
            "Set artifact bucket name (example: `export CEW_ARTIFACT_BUCKET=cew-artifacts-<account>-<region>`).",
        )

    artifact_store = ArtifactStore(mock_mode=False, region_name=region)
    session_id = f"doctor-{uuid.uuid4().hex[:8]}"
    upload = artifact_store.upload_artifact(
        session_id=session_id,
        name="doctor-check.txt",
        content_bytes=b"doctor-write-check\n",
    )

    s3_uri = str(upload.get("s3_uri", ""))
    sha256 = str(upload.get("sha256", ""))
    if not s3_uri.startswith("s3://") or len(sha256) != 64:
        _fail(
            "S3 write check returned an invalid artifact reference.",
            "Verify bucket permissions include `s3:PutObject` on the configured prefix.",
        )

    return bucket, artifact_store.prefix


def _check_bedrock(region: str) -> str:
    if not _is_truthy(os.getenv("BEDROCK_ENABLED", "0")):
        return "Bedrock optional; fallback enabled"

    try:
        client = boto3.client("bedrock", region_name=region)
        client.list_foundation_models(byOutputModality="TEXT")
    except ClientError as exc:
        _fail(
            f"Bedrock access check failed: {exc.response.get('Error', {}).get('Message', str(exc))}",
            "Grant Bedrock access (`bedrock:ListFoundationModels` and invoke permissions) or set `BEDROCK_ENABLED=0`.",
        )

    return "Bedrock access check passed"


def main() -> int:
    print("Running doctor checks...")
    try:
        _check_python()
        _check_aws_cli()
        region = _check_region()
        identity = _check_identity(region)
        nodes_table, edges_table = _check_graph_roundtrip(region)
        artifact_bucket, artifact_prefix = _check_s3_write(region)
        bedrock_message = _check_bedrock(region)
    except CheckFailure as exc:
        print(f"FAIL: {exc.message}")
        print(f"REMEDIATION: {exc.remediation}")
        return 1

    print("PASS: doctor checks complete")
    print(f"account_id={identity['account_id']}")
    print(f"arn={identity['arn']}")
    print(f"region={region}")
    print(f"graph_nodes_table={nodes_table}")
    print(f"graph_edges_table={edges_table}")
    print(f"artifact_bucket={artifact_bucket}")
    print(f"artifact_prefix={artifact_prefix}")
    print(bedrock_message)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
