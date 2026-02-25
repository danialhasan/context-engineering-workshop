# 90-Minute Lab Guide (Harness + Swarm)

Goal: start from an initialized harness scaffold, then use an agent-driven coder workflow to complete implementation with TDD and evidence-gated verification.

## CP0: Setup (fast)

```bash
make install
make provision     # creates GraphNodes/GraphEdges + an artifact bucket (prints exports)
make doctor
./aws_tool list-skills
```

Notes:
- If you see `ExpiredToken` or `AccessDenied`, refresh AWS credentials via the workshop link and retry.
- Bedrock inference is required for workshop chat/harness loops. Ensure model access is enabled in your workshop account.

## CP1: Single-Agent Lifecycle (PLAN -> ACT -> VERIFY)

Pick a session id (use the same value for `--session` and `run_id`):

```bash
SESSION="cew-$(date +%s)"
```

1) PLAN: create a task

```bash
./aws_tool run create_task \
  --session "$SESSION" --phase PLAN \
  --json "{\"run_id\":\"$SESSION\",\"title\":\"Write evidence and verify it\",\"description\":\"Demonstrate receipts + artifacts + verification\"}"
```

2) ACT: claim the task (you are the worker)

```bash
./aws_tool run list_tasks --session "$SESSION" --phase PLAN --json "{\"run_id\":\"$SESSION\"}"
# copy task_id from output

./aws_tool run claim_task \
  --session "$SESSION" --phase ACT \
  --json "{\"run_id\":\"$SESSION\",\"task_id\":\"<task_id>\",\"agent_id\":\"worker-1\"}"
```

3) ACT: create evidence (upload artifact)

```bash
./aws_tool run upload_artifact \
  --session "$SESSION" --phase ACT \
  --json "{\"run_id\":\"$SESSION\",\"name\":\"evidence.txt\",\"content\":\"hello from ACT\"}"
# copy s3_uri from output
```

4) ACT: complete the task (pending verification)

```bash
./aws_tool run complete_task \
  --session "$SESSION" --phase ACT \
  --json "{\"run_id\":\"$SESSION\",\"task_id\":\"<task_id>\",\"agent_id\":\"worker-1\",\"summary\":\"Uploaded evidence artifact\",\"artifact_uri\":\"<s3_uri>\",\"status\":\"success\"}"
```

5) VERIFY: verify the evidence and promote state

```bash
./aws_tool run verify_task \
  --session "$SESSION" --phase VERIFY \
  --json "{\"run_id\":\"$SESSION\",\"task_id\":\"<task_id>\",\"check_type\":\"s3_head_object\",\"artifact_uri\":\"<s3_uri>\"}"
```

6) Inspect: evidence-gated promotion is now visible in the graph

```bash
./aws_tool run neighbors \
  --session "$SESSION" --phase VERIFY \
  --json "{\"run_id\":\"$SESSION\",\"node_id\":\"<task_id>\",\"direction\":\"outbound\"}"
```

## CP2: Agent-Invoked Retrieval (RAG as tools)

```bash
./aws_tool run search_nodes \
  --session "$SESSION" --phase PLAN \
  --json "{\"run_id\":\"$SESSION\",\"query\":\"evidence\",\"limit\":5}"
```

This is the workshop posture:
- the agent decides when to retrieve,
- tools expose state and evidence surfaces,
- assembly is agent-native under budget and phase constraints.

## CP3: Initializer -> Coder Implementation Pass

```bash
./aws_tool run get_node \
  --session "$SESSION" --phase PLAN \
  --json "{\"run_id\":\"$SESSION\",\"node_id\":\"<task_id>\"}"

./aws_tool run search_nodes \
  --session "$SESSION" --phase PLAN \
  --json "{\"run_id\":\"$SESSION\",\"query\":\"verification\",\"limit\":10}"

./aws_tool run assemble_context_view_agent \
  --session "$SESSION" --phase PLAN \
  --json "{\"run_id\":\"$SESSION\",\"task\":\"Summarize latest verified implementation state\",\"phase\":\"PLAN\",\"token_budget\":800,\"retrieval_hints\":{\"query\":\"verification evidence\",\"types\":[\"Objective\",\"Plan\",\"Task\",\"Receipt\",\"TestResult\"],\"limit\":40}}"
```

Coder pass guidance:
- Start from scaffolded TODOs.
- Implement one TODO at a time.
- Use TDD per TODO.
- Attach receipts/artifacts for each meaningful step.
- Verify before promotion.

Verification levels:
1. Schema/contract verification (tool + phase + payload shape).
2. Deterministic runtime verification (read-back/head/test command).
3. Objective verification (task-level done criteria linked to evidence).

Optional control experiment:

```bash
make compile STRATEGY=recite SESSION="$SESSION" TASK="Summarize latest verified state"
make compile STRATEGY=graph_first SESSION="$SESSION" TASK="Summarize latest verified state"
```

## CP4: Swarm Lifecycle (Planner / Workers / Verifier)

In your agent tool (Kiro/Cursor/Claude Code/Codex), create 3 agents:
- Planner: creates tasks (PLAN)
- Worker(s): claim + act (ACT)
- Verifier: verifies + promotes (VERIFY)

All agents share the same `SESSION`. Use `list_tasks`, `claim_task`, `complete_task`, `verify_task` to coordinate.

## Optional: Smoke Proof Artifact

```bash
make smoke
```
