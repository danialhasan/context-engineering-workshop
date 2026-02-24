"""Compile context packs using strategy toggles."""

from __future__ import annotations

import argparse
import json
import os
from pathlib import Path

from src.artifacts.store import ArtifactStore
from src.graph.compiler import ContextCompiler
from src.graph.context_graph import GraphStore


def _is_truthy(value: str | None) -> bool:
    return str(value).lower() in {"1", "true", "yes", "on"}


def main() -> int:
    parser = argparse.ArgumentParser(description="Compile a context pack for a session.")
    parser.add_argument("--strategy", required=True, choices=["recite", "graph_first"])
    parser.add_argument("--session", required=True, help="Session id to compile")
    parser.add_argument("--task", required=True, help="Current task/objective text")
    parser.add_argument("--phase", default=os.getenv("PHASE", "VERIFY"), choices=["PLAN", "ACT", "VERIFY"])
    parser.add_argument("--token-budget", type=int, default=int(os.getenv("TOKEN_BUDGET", "1200")))
    parser.add_argument("--output", default="context_pack.json")
    parser.add_argument("--no-compaction", action="store_true")
    args = parser.parse_args()

    mock_mode = _is_truthy(os.getenv("CEW_MOCK_AWS", "0"))
    graph = GraphStore(mock_mode=mock_mode)
    artifacts = ArtifactStore(mock_mode=mock_mode)
    compiler = ContextCompiler(graph_store=graph, artifact_store=artifacts, mock_mode=mock_mode)

    pack = compiler.compile_context_pack(
        session_id=args.session,
        task=args.task,
        strategy=args.strategy,
        phase=args.phase,
        token_budget=args.token_budget,
        attempt_compaction=not args.no_compaction,
    )

    output_path = Path(args.output)
    output_path.write_text(json.dumps(pack, indent=2), encoding="utf-8")
    print(json.dumps(pack, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
