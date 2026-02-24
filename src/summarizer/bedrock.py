"""Optional Bedrock summarizer with graceful fallback behavior."""

from __future__ import annotations

import json
import os

import boto3


def summarize_with_bedrock(text: str, max_chars: int = 800) -> str:
    model_id = os.getenv("BEDROCK_MODEL_ID", "anthropic.claude-3-haiku-20240307-v1:0")
    prompt = (
        "Summarize the following evidence in <= "
        f"{max_chars} characters. Focus on actionable facts.\n\n{text}"
    )
    client = boto3.client("bedrock-runtime")
    response = client.invoke_model(
        modelId=model_id,
        contentType="application/json",
        accept="application/json",
        body=json.dumps(
            {
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 256,
                "messages": [{"role": "user", "content": prompt}],
            }
        ),
    )
    payload = json.loads(response["body"].read().decode("utf-8"))
    chunks = payload.get("content", [])
    text_out = "".join(chunk.get("text", "") for chunk in chunks if isinstance(chunk, dict))
    return text_out[:max_chars]
