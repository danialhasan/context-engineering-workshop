# Context Engineering Workshop Spec (Readiness Freeze)

## 1) Outcomes (Measurable)

By the end of the 90-minute workshop, each attendee can:

1. Run `make doctor` successfully in a fresh AWS workshop account.
2. Run `make provision` successfully (or confirm required resources already exist).
3. Complete one initializer -> coder implementation pass with TDD and verification levels.
4. Complete one PLAN -> ACT -> VERIFY loop using allowlisted tools (tasks, receipts, artifacts, verification).
5. Show persisted evidence:
   - graph nodes/edges in DynamoDB (`GraphNodes`, `GraphEdges`)
   - large artifacts in S3 (`CEW_ARTIFACT_BUCKET`)
6. Use `aws_tool` as the allowlisted execution wrapper (`list-skills` and `run`).
7. Show Bedrock-optional behavior (fallback path still works when `BEDROCK_ENABLED=0`).

Lecture outcome (30-minute block):

1. Attendees can explain the five primitives and how they compose:
   - ontology
   - context graph
   - skill graph
   - context compiler
   - orchestrator loop with verification gating

## 2) Constraints (MVP Scope)

- Time-boxed for a single 90-minute hands-on session.
- AWS primitives only: DynamoDB, S3, IAM/STS, optional Bedrock.
- Bedrock must remain optional for workshop pass criteria.
- No additional AWS services are introduced.
- Agent-facing execution path stays behind `aws_tool` with schema/phase validation.

## 3) Runtime Configuration and Resource Assumptions

Required environment variables:

```bash
export AWS_REGION=<workshop-region>
export AWS_DEFAULT_REGION=$AWS_REGION
export CEW_GRAPH_NODES_TABLE=GraphNodes
export CEW_GRAPH_EDGES_TABLE=GraphEdges
export CEW_ARTIFACT_BUCKET=<workshop-bucket>
export BEDROCK_ENABLED=0
```

Notes:
- `CEW_MOCK_AWS=1` is explicit mock mode. Real workshop flow uses `CEW_MOCK_AWS=0` or unset.
- CloudShell is acceptable only when `python3 --version` is 3.10+.

DynamoDB table assumptions used by code:
- `GraphNodes` partition key: `node_id` (String)
- `GraphEdges` partition key: `edge_id` (String)
- Graph traversal uses `Scan` filters on `from_id`/`to_id`; `dynamodb:Scan` permission is required.

## 4) Golden Path Commands (Current)

From repo root:

```bash
make install
make provision
make doctor
```

Current behavior:
- `make install` bootstraps `.venv` (if missing) and installs dependencies in that environment.
- `make provision` creates GraphNodes/GraphEdges and a default artifact bucket when missing, and prints recommended exports.
- `make doctor` checks Python 3.10+, AWS CLI, region, STS identity, DynamoDB table existence + read/write round-trip, S3 write, and optional Bedrock listing.
- `make smoke` is real-AWS only and fails loudly with `stage`, `error`, and `session_id`.
- `make compile` defaults to real AWS (`CEW_MOCK_AWS=0`) unless explicitly overridden; this is a control/baseline tool, not the core workshop path.

Explicit mock mode examples (for local dry-runs only):

```bash
CEW_MOCK_AWS=1 make compile STRATEGY=recite SESSION=demo TASK="demo"
CEW_MOCK_AWS=1 .venv/bin/python -m src.orchestrator.loop --smoke
```

## 5) Implementation Map (Current)

Core entrypoints:
- `Makefile`
- `src/tools/doctor.py`
- `src/tools/smoke.py`
- `src/tools/compile_context.py`

Execution and policy layer:
- `src/aws_tool/cli.py`
- `src/aws_tool/dispatcher.py`
- `skills/*.yml`

State and context:
- `src/graph/context_graph.py`
- `src/graph/compiler.py`
- `src/graph/ontology.py`
- `ontology/ontology.yml`

Artifact and summarization:
- `src/artifacts/store.py`
- `src/summarizer/fallback.py`
- `src/summarizer/bedrock.py`

## 6) Skill Set (Allowlisted)

Current skill names:
- `assemble_context_view_agent`
- `bedrock_infer`
- `resolve_identity`
- `upsert_node`
- `link_edge`
- `upload_artifact`
- `write_receipt`
- `compile_context_pack`
- `summarize_evidence`
- `create_task`
- `claim_task`
- `complete_task`
- `verify_task`
- `list_tasks`
- `search_nodes`
- `get_node`
- `neighbors`

Inspection command:

```bash
./aws_tool list-skills
# or
.venv/bin/python -m src.aws_tool.cli list-skills
```

## 7) Workshop Checkpoints (CP0-CP4)

### CP0 (10 min): Environment + Doctor

Commands:

```bash
python3 --version
aws sts get-caller-identity
make install
make provision
make doctor
```

Pass criteria:
- Python 3.10+
- `make doctor` exits 0 and prints `PASS: doctor checks complete`

### CP1 (25 min): Single-Agent Lifecycle (Tasks + Evidence)

Commands:

```bash
SESSION="cew-$(date +%s)"
./aws_tool run create_task --session "$SESSION" --phase PLAN --json "{\"run_id\":\"$SESSION\",\"title\":\"Write evidence and verify it\"}"
./aws_tool run list_tasks --session "$SESSION" --phase PLAN --json "{\"run_id\":\"$SESSION\"}"
# copy task_id
./aws_tool run claim_task --session "$SESSION" --phase ACT --json "{\"run_id\":\"$SESSION\",\"task_id\":\"<task_id>\",\"agent_id\":\"worker-1\"}"
./aws_tool run upload_artifact --session "$SESSION" --phase ACT --json "{\"run_id\":\"$SESSION\",\"name\":\"evidence.txt\",\"content\":\"hello from ACT\"}"
# copy s3_uri
./aws_tool run complete_task --session "$SESSION" --phase ACT --json "{\"run_id\":\"$SESSION\",\"task_id\":\"<task_id>\",\"agent_id\":\"worker-1\",\"summary\":\"Uploaded evidence\",\"artifact_uri\":\"<s3_uri>\",\"status\":\"success\"}"
./aws_tool run verify_task --session "$SESSION" --phase VERIFY --json "{\"run_id\":\"$SESSION\",\"task_id\":\"<task_id>\",\"check_type\":\"s3_head_object\",\"artifact_uri\":\"<s3_uri>\"}"
```

Pass criteria:
- exits 0
- task transitions to verified (`verify_task` returns `status=pass`)

### CP2 (10 min): Agent-Invoked Retrieval

Commands:

```bash
./aws_tool run search_nodes --session "$SESSION" --phase PLAN --json "{\"run_id\":\"$SESSION\",\"query\":\"evidence\",\"limit\":5}"
./aws_tool run neighbors --session "$SESSION" --phase VERIFY --json "{\"run_id\":\"$SESSION\",\"node_id\":\"<task_id>\",\"direction\":\"outbound\"}"
```

Pass criteria:
- retrieval returns expected nodes/receipts for the session
- task shows outbound evidence edges

### CP3 (20 min): Initializer -> Coder Implementation Pass (Agent-Native)

Commands:

```bash
./aws_tool run get_node --session "$SESSION" --phase PLAN --json "{\"run_id\":\"$SESSION\",\"node_id\":\"<task_id>\"}"
./aws_tool run search_nodes --session "$SESSION" --phase PLAN --json "{\"run_id\":\"$SESSION\",\"query\":\"verification\",\"limit\":10}"
```

Pass criteria:
- attendee uses the initialized scaffold and completes at least one coder TODO with TDD
- verification level 1 passes (schema/phase/tool contract)
- verification level 2 passes (deterministic runtime check)
- verification level 3 passes (task objective satisfied with linked evidence)

Optional control experiment:

```bash
make compile STRATEGY=recite SESSION="$SESSION" TASK="Summarize latest verified state"
make compile STRATEGY=graph_first SESSION="$SESSION" TASK="Summarize latest verified state"
```

### CP4 (25 min): Swarm Lifecycle + Optional Smoke Proof Artifact

Commands:

```bash
# Swarm: planner creates tasks, workers claim/complete, verifier promotes.
# (Executed via your agent tool as multiple agents using the same SESSION.)

# Optional: repo golden-path proof artifact
make smoke
```

Pass criteria:
- swarm coordination works without cross-agent confusion (tasks/claims/evidence are typed)
- smoke remains available as an optional end-to-end proof artifact

## 8) Readiness Freeze Definition (Tomorrow)

By Wednesday, February 25, 2026, freeze is achieved only if:

1. Golden path (`install -> provision -> doctor`) works in a fresh workshop account.
2. Single-agent lifecycle works end-to-end (tasks -> evidence -> verify).
3. Docs use current env var names and current commands only.
4. Bedrock remains optional and does not block baseline success.
5. Escalation guidance for IAM/region/resource issues is ready for on-site SA support.

## 9) Definition of Done

Done means, in a fresh AWS workshop account:

1. `make doctor` passes.
2. Initializer step completes (`install`, `provision`, `doctor`, tool list visible).
3. Coder step completes for at least one TODO with TDD and three verification levels.
4. Single-agent lifecycle succeeds (tasks + receipts + artifact + verify).
5. Swarm lifecycle succeeds with role-separated coordination (planner/worker/verifier).
6. Participant/facilitator/SA docs are consistent with implemented behavior.
