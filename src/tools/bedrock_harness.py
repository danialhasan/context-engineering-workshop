"""CLI entrypoint for the Bedrock-first harness loop."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from src.orchestrator.bedrock_harness import (
    BedrockHarnessConfig,
    DEFAULT_SYSTEM_PROMPT,
    run_bedrock_harness,
)


def main() -> int:
    parser = argparse.ArgumentParser(description="Run Bedrock harness with tool calls.")
    parser.add_argument("--session", required=True, help="run/session id")
    parser.add_argument("--phase", default="PLAN", choices=["PLAN", "ACT", "VERIFY"])
    parser.add_argument("--goal", required=True, help="goal for this harness run")
    parser.add_argument("--session-key", default="harness-main")
    parser.add_argument("--model-id", default=None)
    parser.add_argument("--system-prompt", default=None)
    parser.add_argument("--max-steps", type=int, default=6)
    parser.add_argument("--max-history-turns", type=int, default=8)
    parser.add_argument("--max-tokens", type=int, default=400)
    parser.add_argument("--temperature", type=float, default=0.0)
    parser.add_argument("--no-external-stubs", action="store_true")
    parser.add_argument("--output", default="")
    args = parser.parse_args()

    config = BedrockHarnessConfig(
        run_id=args.session,
        phase=args.phase,
        goal=args.goal,
        session_key=args.session_key,
        model_id=args.model_id,
        system_prompt=args.system_prompt or DEFAULT_SYSTEM_PROMPT,
        max_steps=args.max_steps,
        max_history_turns=args.max_history_turns,
        max_tokens=args.max_tokens,
        temperature=args.temperature,
        include_external_stubs=not args.no_external_stubs,
    )
    result = run_bedrock_harness(config)

    if args.output:
        out = Path(args.output)
        out.write_text(json.dumps(result, indent=2), encoding="utf-8")

    print(json.dumps(result, indent=2))
    return 0 if bool(result.get("ok")) else 1


if __name__ == "__main__":
    raise SystemExit(main())
