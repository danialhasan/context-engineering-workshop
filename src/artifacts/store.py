"""Artifact storage backed by S3 or local files."""

from __future__ import annotations

import hashlib
import os
import re
import tempfile
import uuid
from pathlib import Path

import boto3

from src.aws_tool.aws_cli import run_aws_cli

class ArtifactStore:
    def __init__(self, mock_mode: bool | None = None, region_name: str | None = None) -> None:
        if mock_mode is None:
            mock_mode = os.getenv("CEW_MOCK_AWS", "0") == "1"
        self.mock_mode = mock_mode
        self.region_name = region_name or os.getenv("AWS_REGION") or os.getenv("AWS_DEFAULT_REGION")
        self.bucket = os.getenv("CEW_ARTIFACT_BUCKET", "")
        self.prefix = os.getenv("CEW_ARTIFACT_PREFIX", "workshop-artifacts").strip("/")
        if not self.bucket and not self.mock_mode:
            # Reduce setup friction: default to a globally-unique bucket name derived from the AWS account id.
            self.bucket = self._derive_default_bucket()
            os.environ.setdefault("CEW_ARTIFACT_BUCKET", self.bucket)

    def _derive_default_bucket(self) -> str:
        if not self.region_name:
            raise RuntimeError("AWS region is required to derive a default artifact bucket.")
        os.environ.setdefault("AWS_EC2_METADATA_DISABLED", "true")
        sts = boto3.client("sts", region_name=self.region_name)
        account_id = str(sts.get_caller_identity().get("Account") or "").strip()
        if not account_id:
            raise RuntimeError("Could not determine AWS account id to derive artifact bucket.")
        return f"cew-artifacts-{account_id}-{self.region_name}"

    def _safe_name(self, name: str) -> str:
        cleaned = re.sub(r"[^a-zA-Z0-9._-]", "-", name).strip("-")
        return cleaned or "artifact"

    def upload_artifact(
        self,
        session_id: str,
        name: str,
        local_path: str | None = None,
        content_bytes: bytes | None = None,
    ) -> dict[str, object]:
        """Upload artifact from either local_path or content_bytes."""
        if (local_path is None and content_bytes is None) or (local_path and content_bytes is not None):
            raise ValueError("Provide exactly one of local_path or content_bytes.")

        if local_path is not None:
            payload = Path(local_path).read_bytes()
        else:
            payload = content_bytes or b""

        digest = hashlib.sha256(payload).hexdigest()
        safe_name = self._safe_name(name)
        object_name = f"{uuid.uuid4().hex[:8]}-{safe_name}"

        if self.mock_mode:
            base = Path("logs/artifacts") / session_id
            base.mkdir(parents=True, exist_ok=True)
            out_path = base / object_name
            out_path.write_bytes(payload)
            return {
                "s3_uri": str(out_path),
                "sha256": digest,
                "bytes": len(payload),
            }

        if not self.bucket:
            raise RuntimeError("CEW_ARTIFACT_BUCKET is required when CEW_MOCK_AWS=0.")

        key = f"{self.prefix}/{session_id}/{object_name}"
        with tempfile.NamedTemporaryFile(delete=False) as temp_file:
            temp_file.write(payload)
            temp_path = temp_file.name

        try:
            cli = run_aws_cli(
                [
                    "s3api",
                    "put-object",
                    "--bucket",
                    self.bucket,
                    "--key",
                    key,
                    "--body",
                    temp_path,
                    "--output",
                    "json",
                ],
                expect_json=True,
            )
        finally:
            try:
                Path(temp_path).unlink(missing_ok=True)
            except OSError:
                pass

        if cli.exit_code != 0:
            raise RuntimeError(cli.stderr.strip() or cli.stdout.strip() or "s3api put-object failed")

        etag = ""
        if isinstance(cli.parsed_json, dict):
            etag = str(cli.parsed_json.get("ETag", "")).strip('"')
        return {
            "s3_uri": f"s3://{self.bucket}/{key}",
            "sha256": digest,
            "etag": etag,
            "bytes": len(payload),
        }

    def put_text(self, run_id: str, artifact_type: str, content: str) -> dict[str, object]:
        """Backward-compatible helper used by existing smoke flow."""
        result = self.upload_artifact(
            session_id=run_id,
            name=f"{artifact_type}.txt",
            content_bytes=content.encode("utf-8"),
        )
        return {
            "artifact_id": f"art-{uuid.uuid4().hex[:12]}",
            "s3_uri": result["s3_uri"],
            "etag": result.get("etag", f"mock-{uuid.uuid4().hex[:8]}"),
            "bytes": result["bytes"],
            "sha256": result["sha256"],
        }

    def get_text(self, reference: str) -> str:
        if reference.startswith("s3://"):
            if self.mock_mode:
                return ""
            bucket_key = reference.replace("s3://", "", 1)
            bucket, key = bucket_key.split("/", 1)
            client = boto3.client("s3", region_name=self.region_name)
            body = client.get_object(Bucket=bucket, Key=key)["Body"].read()
            return body.decode("utf-8")

        path = Path(reference)
        if path.exists():
            return path.read_text(encoding="utf-8")
        return reference
