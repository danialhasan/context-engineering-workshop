"""Provision minimal AWS resources for the workshop (DynamoDB + S3).

This is intentionally small and deterministic:
- GraphNodes table (pk: node_id, S)
- GraphEdges table (pk: edge_id, S)
- Artifact bucket (CEW_ARTIFACT_BUCKET or derived default)
"""

from __future__ import annotations

import argparse
import os
from dataclasses import dataclass

import boto3
from botocore.exceptions import ClientError, NoCredentialsError, NoRegionError


@dataclass
class ProvisionFailure(Exception):
    message: str


def _fail(message: str) -> None:
    raise ProvisionFailure(message=message)


def _region() -> str:
    region = os.getenv("AWS_REGION") or os.getenv("AWS_DEFAULT_REGION")
    if not region:
        region = boto3.session.Session().region_name
    if not region:
        _fail("AWS region is not configured. Set AWS_REGION or run `aws configure set region <region>`.")
    os.environ.setdefault("AWS_REGION", region)
    return region


def _account_id(region: str) -> str:
    os.environ.setdefault("AWS_EC2_METADATA_DISABLED", "true")
    try:
        sts = boto3.client("sts", region_name=region)
        identity = sts.get_caller_identity()
    except (NoCredentialsError, NoRegionError) as exc:
        _fail(f"AWS credentials/region not available: {exc}")
        raise AssertionError from exc
    except ClientError as exc:
        _fail(f"STS identity check failed: {exc.response.get('Error', {}).get('Message', str(exc))}")
        raise AssertionError from exc
    return str(identity.get("Account") or "")


def _ensure_table(ddb, region: str, table_name: str, pk_name: str) -> None:
    try:
        ddb.describe_table(TableName=table_name)
        return
    except ClientError as exc:
        code = exc.response.get("Error", {}).get("Code", "")
        if code != "ResourceNotFoundException":
            raise

    ddb.create_table(
        TableName=table_name,
        AttributeDefinitions=[{"AttributeName": pk_name, "AttributeType": "S"}],
        KeySchema=[{"AttributeName": pk_name, "KeyType": "HASH"}],
        BillingMode="PAY_PER_REQUEST",
    )
    waiter = ddb.get_waiter("table_exists")
    waiter.wait(TableName=table_name)


def _ensure_bucket(s3, region: str, bucket: str) -> None:
    try:
        s3.head_bucket(Bucket=bucket)
        return
    except ClientError as exc:
        code = exc.response.get("Error", {}).get("Code", "")
        if code not in {"404", "NoSuchBucket", "NotFound"}:
            # AccessDenied can occur if bucket exists but is not ours.
            raise

    if region == "us-east-1":
        s3.create_bucket(Bucket=bucket)
    else:
        s3.create_bucket(
            Bucket=bucket,
            CreateBucketConfiguration={"LocationConstraint": region},
        )


def main() -> int:
    parser = argparse.ArgumentParser(description="Provision workshop DynamoDB + S3 resources.")
    parser.add_argument(
        "--write-dotenv",
        action="store_true",
        help="Update repo .env with the computed CEW_ARTIFACT_BUCKET (does not touch credentials).",
    )
    args = parser.parse_args()

    try:
        region = _region()
        account_id = _account_id(region)

        nodes_table = os.getenv("CEW_GRAPH_NODES_TABLE", "GraphNodes")
        edges_table = os.getenv("CEW_GRAPH_EDGES_TABLE", "GraphEdges")
        bucket = os.getenv("CEW_ARTIFACT_BUCKET") or f"cew-artifacts-{account_id}-{region}"

        ddb = boto3.client("dynamodb", region_name=region)
        s3 = boto3.client("s3", region_name=region)

        _ensure_table(ddb, region, nodes_table, "node_id")
        _ensure_table(ddb, region, edges_table, "edge_id")
        _ensure_bucket(s3, region, bucket)

        if args.write_dotenv and os.path.exists(".env"):
            lines = []
            replaced = False
            with open(".env", "r", encoding="utf-8") as handle:
                for line in handle:
                    if line.startswith("CEW_ARTIFACT_BUCKET="):
                        lines.append(f"CEW_ARTIFACT_BUCKET={bucket}\n")
                        replaced = True
                    else:
                        lines.append(line)
            if not replaced:
                lines.append(f"CEW_ARTIFACT_BUCKET={bucket}\n")
            with open(".env", "w", encoding="utf-8") as handle:
                handle.writelines(lines)

        print("Provisioning complete.")
        print(f"region={region}")
        print(f"graph_nodes_table={nodes_table}")
        print(f"graph_edges_table={edges_table}")
        print(f"artifact_bucket={bucket}")
        print("")
        print("Recommended exports:")
        print(f"export AWS_REGION={region}")
        print(f"export AWS_DEFAULT_REGION={region}")
        print(f"export CEW_GRAPH_NODES_TABLE={nodes_table}")
        print(f"export CEW_GRAPH_EDGES_TABLE={edges_table}")
        print(f"export CEW_ARTIFACT_BUCKET={bucket}")
        return 0
    except ProvisionFailure as exc:
        print(f"FAIL: {exc.message}")
        return 1


if __name__ == "__main__":
    raise SystemExit(main())

