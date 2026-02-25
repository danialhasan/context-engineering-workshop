# Workshop Scenario Runbook (A-E)

Status: Draft (implementation-aligned)
Owner: Workshop implementation track

## Goal

Run five deterministic workshop scenarios and inspect expected behavior in the glass-case GUI.

## Prerequisites

```bash
make install
make doctor
./aws_tool list-skills
```

## Run the Full Suite

```bash
SESSION_BASE="workshop-$(date +%s)"
make workshop-scenarios SESSION_BASE="$SESSION_BASE"
```

Outputs:
- JSON result printed to stdout
- `logs/workshop-scenarios-last.json`
- Session ids:
  - `${SESSION_BASE}-a`
  - `${SESSION_BASE}-b`
  - `${SESSION_BASE}-c`
  - `${SESSION_BASE}-d`
  - `${SESSION_BASE}-e`

## Run One Scenario

```bash
SESSION_BASE="workshop-$(date +%s)"
make workshop-scenarios SESSION_BASE="$SESSION_BASE" SCENARIO=C
```

## Scenario Expectations

1. Scenario A (Happy path)
- Task should promote to `done` only after verification succeeds.
- Receipts/artifacts should be linked in graph state.

2. Scenario B (No evidence attempt)
- Verification should fail (`status=fail`) for missing object.
- Task should be `blocked`.

3. Scenario C (Parallel writes)
- Same task should show claims from two different workers.
- Resolution should reflect the worker that produced verified completion.

4. Scenario D (Lease timeout + reassign)
- Initial claim has short lease and expires.
- Reassign claim appears for second worker.

5. Scenario E (Stale context)
- Stale decision and fresh superseding decision both exist.
- Retrieval should prioritize fresh node.

## GUI Inspection Path

1. Start GUI:

```bash
make gui
```

2. Open:
- `http://127.0.0.1:8765`

3. Set `Session` to one of `${SESSION_BASE}-{a|b|c|d|e}` and inspect:
- timeline/tool events/memory/graph panels
- chat route for thread/session behavior if needed

## Troubleshooting

1. Credentials expired:
- Refresh workshop AWS credentials and rerun `make doctor`.

2. Bedrock unavailable:
- Scenarios still run (except model quality expectations) if CLI permissions are valid.

3. S3 verification fails unexpectedly in Scenario A:
- Confirm artifact bucket write/read permissions in `make doctor`.

