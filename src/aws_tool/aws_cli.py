"""Safe subprocess wrapper for AWS CLI invocations."""

from __future__ import annotations

import json
import subprocess
from dataclasses import dataclass
from typing import Any


@dataclass
class AwsCliResult:
    args: list[str]
    stdout: str
    stderr: str
    exit_code: int
    parsed_json: dict[str, Any] | list[Any] | None


def run_aws_cli(args: list[str], expect_json: bool = True) -> AwsCliResult:
    """Run AWS CLI safely without shell=True and capture outputs."""
    cmd = ["aws", *args]
    proc = subprocess.run(
        cmd,
        check=False,
        capture_output=True,
        text=True,
    )

    parsed: dict[str, Any] | list[Any] | None = None
    stdout = proc.stdout.strip()
    if expect_json and stdout:
        try:
            parsed = json.loads(stdout)
        except json.JSONDecodeError:
            parsed = None

    return AwsCliResult(
        args=cmd,
        stdout=proc.stdout,
        stderr=proc.stderr,
        exit_code=proc.returncode,
        parsed_json=parsed,
    )
