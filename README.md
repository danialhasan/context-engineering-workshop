# context-engineering-workshop

This repo is a lecture + hands-on workshop for context engineering systems that move from a single agent loop to coordinated agent swarms.

## Lecture + Workshop (Concepts First)

### Why this exists

Most real agent failures are not model failures. They are context failures:

- unclear state
- ambiguous tool access
- no verification loop
- context overload and drift

The workshop teaches context engineering as systems engineering for attention: we feed the smallest high-signal context for the current task, then update shared state with evidence.

### Agent model used in this workshop

An agent is treated as a stateful control loop around a stateless reasoning model:

1. read state and objective
2. decide next action
3. call tools
4. write receipts/evidence
5. stop or continue

The model is one part. The harness is everything around it: tool contracts, memory, context assembly, and verification.

### Five primitives used end to end

1. Ontology: shared meaning and typed coordination objects (`Task`, `Claim`, `Receipt`, `Artifact`, `TestResult`, etc.).
2. Context graph: durable state/evidence outside the token window.
3. Skill graph: controlled capability via allowlisted tools, input/output schema validation, and phase gating (`PLAN`, `ACT`, `VERIFY`).
4. Context compiler: agent-native context assembly under token/time budgets.
5. Verification loop: no promotion without evidence; outcomes change what gets selected next.

### Compiler posture in this repo

We use "compiler" intentionally:

- Input: messy runtime state (nodes, edges, receipts, artifacts, evidence)
- Passes: select -> rank -> budget -> compact
- Output: execution artifact (`context_pack.json`)

Important workshop policy:

- Retrieval is agent-invoked (`search_nodes`, `get_node`, `neighbors`, `list_tasks`)
- Assembly is agent-native (subagent/tool-driven context selection and packing)
- Promotion is evidence-gated (`verify_task`)

Deterministic vs agentic pipeline expression:

- Deterministic code path (tool algorithms): cheaper, faster, easier to test, easier to verify.
- Agentic natural-language path (skills/subagents): stochastic and more expensive, needs dedicated eval strategy, but can better handle intent and ambiguity.
- Practical posture: keep deterministic helper tools, but run the end-to-end assembly loop as agent-native so intent drives context selection.

Composable compiler pipeline used for teaching:

1. deterministic seed pack (objective, plan, constraints, allowed tools)
2. candidate generation (agentic search, optional semantic retrieval)
3. graph expansion (typed neighbor traversal)
4. agent-native rank + budget + pack (using tool outputs + policy prompts)
5. verification writes evidence back; next assembly prioritizes it

Current implementation note:

- The repo currently includes deterministic compile paths (`recite`, `graph_first`) as a baseline.
- This is useful for reliability checks and controlled demos.
- The workshop direction moves final assembly to an agent-native subagent loop with deterministic helpers.

### Research alignment section (lecture)

The lecture compares three production perspectives and maps them to the five primitives:

- Anthropic: finite context budgets and high-signal token curation for long-running agents.
- OpenAI: harness engineering, legible repos as systems of record, and feedback loops around execution.
- Manus: long-loop context discipline (recitation, tool stability, trace retention, failure as signal).

Dedicated lecture sections are built around these three sources directly, not only their conclusions.

### Workshop flow (sequential, same day)

1. Setup and resource checks (`install -> provision -> doctor`)
2. Single-agent lifecycle (`PLAN -> ACT -> VERIFY`) with typed tasks and evidence
3. Agent-invoked retrieval + agent-native assembly (with deterministic helpers available)
4. Swarm lifecycle using the same primitives with explicit coordination roles:
   - planner creates tasks
   - workers claim and execute
   - verifier promotes state based on evidence

Single-agent vs swarm difference:

- Same primitives in both modes.
- The swarm adds coordination pressure: typed handoffs, role rights, and cross-agent verification claims.

### Workshop side quest: failure-mode pulse (5 min)

- Mid-workshop, run a 5-minute Mentimeter (or equivalent poll) asking attendees for their top daily agent failure modes and gripes.
- Treat this as useful workshop data: cluster responses, map them to harness primitives, and feed the debrief.
- Optional follow-up: write the summarized findings as an artifact/receipt so the session captures real participant pain points.

### Data scope and freshness policy

Context graph scope:

- Any relevant operational data can become context graph material (codebase state, receipts, artifacts, collaboration traces, external knowledge captures).
- Discovery can be just-in-time through retrieval tools instead of preloading everything into prompts.

Freshness requirements:

- Memory value decays when context gets stale.
- Evolving sources (for example: chat threads, docs, recordings, project files) should be refreshed progressively.
- Refresh strategy can run by hooks (post-message or post-task) and periodic jobs (every N hours), rather than full reindex on every turn.

### Workshop bridge: where AWS fits

- DynamoDB (`GraphNodes`, `GraphEdges`) is structured state for ontology and coordination.
- S3 is artifact and evidence storage.
- Bedrock is the primary inference engine for workshop agent turns and summaries.
- The workshop is not AWS for AWS's sake; AWS is the runtime substrate for the context-engineering harness.

### What attendees leave with

- A reusable context engineering harness pattern for real stacks (not a toy prompt trick)
- A practical framework to evaluate memory/retrieval approaches
- A concrete path from single-agent demos to swarm coordination with typed handoffs and verification

### Design delta: current repo vs target workshop direction

Current in repo:

- Deterministic compiler strategies (`recite`, `graph_first`) as baseline/fallback
- Task/claim/complete/verify coordination skills with receipts
- Agent-invoked retrieval tools over the context graph
- Optional Bedrock-assisted compaction/summarization

Target direction to emphasize in workshop + slides:

- Stronger candidate generation layer before assembly (agentic search + semantic retrieval + graph expansion)
- Final context assembly executed by an agent-native compiler subagent
- Explicit freshness/expiry playbook for evolving context sources
- Side-by-side single-agent and swarm runs where the only variable is coordination design

## Technical Implementation

### Prerequisites

- Python 3.10+
- AWS CLI v2
- AWS credentials with access to STS, DynamoDB, and S3 in the workshop account
- Region configured (`AWS_REGION` and `AWS_DEFAULT_REGION`)

CloudShell note: only use CloudShell when `python3 --version` is 3.10+.

### Environment variables

Core configuration:

```bash
export AWS_REGION=us-west-2
export AWS_DEFAULT_REGION=$AWS_REGION
export CEW_GRAPH_NODES_TABLE=GraphNodes
export CEW_GRAPH_EDGES_TABLE=GraphEdges
export CEW_ARTIFACT_BUCKET=<bucket-name>
export BEDROCK_ENABLED=1
export BEDROCK_MODEL_ID=us.anthropic.claude-opus-4-6-v1
```

Mode switch:

- Real AWS (default): `CEW_MOCK_AWS` unset or `0`
- Mock mode (explicit): `CEW_MOCK_AWS=1`

### Golden path commands

```bash
make install
make provision
make doctor
./aws_tool list-skills
```

What each does:

- `make install`: creates `.venv` (if missing) and installs dependencies.
- `make provision`: creates `GraphNodes` and `GraphEdges` (if missing) and ensures artifact bucket exists.
- `make doctor`: verifies Python, AWS CLI, region, STS identity, DynamoDB read/write round-trip, S3 write, and Bedrock access.
- `./aws_tool list-skills`: prints allowlisted tools and phases.

### Single-agent lifecycle (minimal run)

Use one shared session id:

```bash
SESSION="cew-$(date +%s)"
```

Create task (PLAN):

```bash
./aws_tool run create_task \
  --session "$SESSION" --phase PLAN \
  --json "{\"run_id\":\"$SESSION\",\"title\":\"Write evidence and verify it\"}"
```

Claim task (ACT), then upload artifact, complete, verify:

```bash
./aws_tool run list_tasks --session "$SESSION" --phase PLAN --json "{\"run_id\":\"$SESSION\"}"
./aws_tool run claim_task --session "$SESSION" --phase ACT --json "{\"run_id\":\"$SESSION\",\"task_id\":\"<task_id>\",\"agent_id\":\"worker-1\"}"
./aws_tool run upload_artifact --session "$SESSION" --phase ACT --json "{\"run_id\":\"$SESSION\",\"name\":\"evidence.txt\",\"content\":\"hello from ACT\"}"
./aws_tool run complete_task --session "$SESSION" --phase ACT --json "{\"run_id\":\"$SESSION\",\"task_id\":\"<task_id>\",\"agent_id\":\"worker-1\",\"summary\":\"Uploaded evidence\",\"artifact_uri\":\"<s3_uri>\",\"status\":\"success\"}"
./aws_tool run verify_task --session "$SESSION" --phase VERIFY --json "{\"run_id\":\"$SESSION\",\"task_id\":\"<task_id>\",\"check_type\":\"s3_head_object\",\"artifact_uri\":\"<s3_uri>\"}"
```

Inspect graph edges:

```bash
./aws_tool run neighbors --session "$SESSION" --phase VERIFY --json "{\"run_id\":\"$SESSION\",\"node_id\":\"<task_id>\",\"direction\":\"outbound\"}"
```

### Compile strategies (current baseline/fallback)

```bash
make compile STRATEGY=recite SESSION="$SESSION" TASK="Debrief the verified task"
cp context_pack.json context_pack_recite.json

make compile STRATEGY=graph_first SESSION="$SESSION" TASK="Debrief the verified task"
cp context_pack.json context_pack_graph_first.json
```

`make compile` defaults to real AWS behavior unless `CEW_MOCK_AWS=1` is explicitly set.

Note:

- These compile commands document the current deterministic baseline.
- The target workshop track is agent-native final assembly using retrieval + graph tools, with compile CLI retained as a control path.

Agent-native assembly skill (primary workshop path):

```bash
./aws_tool run assemble_context_view_agent \
  --session "$SESSION" --phase PLAN \
  --json "{\"run_id\":\"$SESSION\",\"task\":\"Debrief the verified task\",\"phase\":\"PLAN\",\"token_budget\":900,\"retrieval_hints\":{\"query\":\"verification evidence\",\"types\":[\"Objective\",\"Plan\",\"Task\",\"Receipt\",\"TestResult\"],\"limit\":50}}"
```

Bedrock inference skill with persisted session memory:

```bash
./aws_tool run bedrock_infer \
  --session "$SESSION" --phase PLAN \
  --json "{\"run_id\":\"$SESSION\",\"session_key\":\"planner-main\",\"prompt\":\"Summarize latest verification and propose next action\"}"
```

Bedrock-first harness loop (tool-calling controller):

```bash
make bedrock-harness SESSION="$SESSION" GOAL="Call resolve_identity, then summarize result."
```

Local workshop GUI (React 19 + json-render):

```bash
make gui
# open http://127.0.0.1:8765
# open http://127.0.0.1:8765/component-registry
# open http://127.0.0.1:8765/chat
```

Dev loop for GUI only:

```bash
npm run gui:dev
```

The GUI shows:

- run status + final response
- Bedrock turn timeline and tool events
- persisted session memory turns
- session graph snapshot (nodes/edges + recent nodes + rendered graph view)
- `/component-registry` route that showcases every json-render catalog component with demo data
- `/chat` route with chat-style conversation threads persisted by `session + session_key` in DynamoDB-backed graph memory
- conversation hydration via `GET /api/session/{session_id}/chat/threads` and `GET /api/session/{session_id}/chat/history`

Notes:

- The harness routes real tools through `aws_tool` with existing schema/phase validation.
- `external.*` tools are intentionally stubs with `TODO(external-system)` markers until those systems are implemented in this repo.

### Optional proof run

```bash
make smoke
```

`make smoke` is real AWS only and fails loudly with stage + error + session id when preconditions are missing.

### Repo map

- `Makefile`: entrypoint commands
- `src/tools/doctor.py`: environment and permissions checks
- `src/tools/provision.py`: DynamoDB/S3 provisioning helper
- `src/tools/smoke.py`: optional integration smoke
- `src/tools/compile_context.py`: compile CLI
- `src/tools/harness_gui_server.py`: local GUI server (`/api/*` + static GUI)
- `src/aws_tool/cli.py`: allowlisted tool CLI (`list-skills`, `run`)
- `src/aws_tool/dispatcher.py`: skill execution, schema/phase gating, provenance
- `src/orchestrator/bedrock_harness.py`: Bedrock-first harness loop
- `src/orchestrator/tool_adapters.py`: adapter registry (real skills + `external.*` stubs)
- `src/graph/context_graph.py`: GraphNodes/GraphEdges persistence layer
- `src/graph/compiler.py`: `recite` and `graph_first` context strategies
- `src/artifacts/store.py`: artifact storage (S3 or mock)
- `ontology/ontology.yml`: node/edge constraints
- `skills/*.yml`: tool contracts exposed to agents

### Related docs

- `LECTURE_DECK.md`
- `WORKSHOP_SPEC.md`
- `docs/workshop/90min-lab.md`
- `PARTICIPANT_QUICKSTART.md`
- `FACILITATOR_RUNBOOK.md`
- `AWS_SA_CHEATSHEET.md`
