#!/usr/bin/env python3
"""Seed sample workshop graph data.

This is a placeholder script used by workshop checkpoints.
"""

from src.graph.context_graph import GraphStore


def main() -> None:
    store = GraphStore()
    run_id = "seed-run"
    store.upsert_node(run_id, "Run", run_id, {"status": "seeded"})
    print("Seeded sample graph data for run_id=seed-run")


if __name__ == "__main__":
    main()
