# Participant Quickstart

Goal: get from login to an initialized harness, then implement and verify the coder step with your agent.

## 1) Login

Choose one path.

Local terminal:
- Use your normal AWS access method (`aws configure`, SSO, or workshop-issued temporary creds).

CloudShell:
- Open AWS Console -> CloudShell.
- Credentials are pre-wired; do not run `aws configure` unless instructed.
- Run `python3 --version` before continuing. This repo requires Python 3.10+.
- If CloudShell reports Python lower than 3.10, switch to a local terminal with Python 3.10+.

## 2) Set Region (Required)

Pick the workshop region and export it explicitly:

```bash
export AWS_REGION=us-east-1
export AWS_DEFAULT_REGION=$AWS_REGION
```

## 3) Configure Credentials

Local terminal (one option):

```bash
aws configure
# or: aws sso login --profile <profile>
```

Quick identity check:

```bash
aws sts get-caller-identity
```

## 4) Set Workshop Environment Variables

```bash
export CEW_GRAPH_NODES_TABLE=GraphNodes
export CEW_GRAPH_EDGES_TABLE=GraphEdges
export CEW_ARTIFACT_BUCKET=<workshop-bucket-name>
export BEDROCK_ENABLED=1
export BEDROCK_MODEL_ID=us.anthropic.claude-opus-4-6-v1
unset CEW_MOCK_AWS
```

## 5) Run Commands

From repo root:

```bash
make install
make provision
make doctor
./aws_tool list-skills
```

Expected:
- `make install` creates/updates `.venv` and installs dependencies there.
- `make doctor` prints `PASS: doctor checks complete`.
- `./aws_tool list-skills` shows the tool surface your agent will use.

## 6) Workshop Flow (Initializer -> Coder)

Initializer step (provided scaffold):

- You start from an initialized repo and infra gate (`install/provision/doctor`).
- The ontology + storage + skill contracts already exist.
- Your job is to use an agent to complete implementation TODOs with TDD and verification.

Coder step (what you do):

1. Create a session:

```bash
SESSION="cew-$(date +%s)"
```

2. Run the lifecycle once (`PLAN -> ACT -> VERIFY`) to establish baseline evidence:

```bash
./aws_tool run create_task --session "$SESSION" --phase PLAN --json "{\"run_id\":\"$SESSION\",\"title\":\"Implement TODO and verify\"}"
./aws_tool run list_tasks --session "$SESSION" --phase PLAN --json "{\"run_id\":\"$SESSION\"}"
# copy task_id
./aws_tool run claim_task --session "$SESSION" --phase ACT --json "{\"run_id\":\"$SESSION\",\"task_id\":\"<task_id>\",\"agent_id\":\"coder-1\"}"
./aws_tool run upload_artifact --session "$SESSION" --phase ACT --json "{\"run_id\":\"$SESSION\",\"name\":\"implementation-notes.txt\",\"content\":\"baseline evidence\"}"
# copy s3_uri
./aws_tool run complete_task --session "$SESSION" --phase ACT --json "{\"run_id\":\"$SESSION\",\"task_id\":\"<task_id>\",\"agent_id\":\"coder-1\",\"summary\":\"Implemented TODO path\",\"artifact_uri\":\"<s3_uri>\",\"status\":\"success\"}"
./aws_tool run verify_task --session "$SESSION" --phase VERIFY --json "{\"run_id\":\"$SESSION\",\"task_id\":\"<task_id>\",\"check_type\":\"s3_head_object\",\"artifact_uri\":\"<s3_uri>\"}"
```

3. Run retrieval as agent-invoked context:

```bash
./aws_tool run search_nodes --session "$SESSION" --phase PLAN --json "{\"run_id\":\"$SESSION\",\"query\":\"verify\",\"limit\":5}"
./aws_tool run neighbors --session "$SESSION" --phase VERIFY --json "{\"run_id\":\"$SESSION\",\"node_id\":\"<task_id>\",\"direction\":\"outbound\"}"
```

4. Optional control experiment (deterministic baseline):

```bash
make compile STRATEGY=recite SESSION="$SESSION" TASK="Summarize latest verified implementation state"
```

## 7) Verification Levels (Use all three)

1. Level 1: tool/schema verification
- Command shape + phase/tool gating + schema validation.

2. Level 2: deterministic runtime verification
- Read-backs, head-object checks, assertions, test commands.

3. Level 3: behavioral/task verification
- The task objective is met with linked receipts/artifacts and no unverified promotion.

## 8) Top 10 Errors and Fixes

1. `AccessDenied` on STS/DynamoDB/S3
- Fix: ask facilitator/SA to attach workshop policy for `sts:GetCallerIdentity`, DynamoDB R/W on `GraphNodes`/`GraphEdges`, and S3 write on workshop bucket/prefix.

2. Wrong region / missing region
- Fix: export both:
  - `export AWS_REGION=<workshop-region>`
  - `export AWS_DEFAULT_REGION=$AWS_REGION`

3. `Bedrock access check failed`
- Fix: refresh workshop credentials, confirm Bedrock model access in the workshop account, and retry with `BEDROCK_ENABLED=1`.

4. Missing `GraphNodes` or `GraphEdges`
- Fix: confirm exact table names and set:
  - `export CEW_GRAPH_NODES_TABLE=GraphNodes`
  - `export CEW_GRAPH_EDGES_TABLE=GraphEdges`

5. Missing or wrong S3 bucket
- Fix: set correct bucket:
  - `export CEW_ARTIFACT_BUCKET=<workshop-bucket-name>`
- Ensure bucket exists in the same region.

6. `UnrecognizedClientException` / invalid security token
- Fix: refresh credentials (`aws sso login` or new temporary creds), then rerun `aws sts get-caller-identity`.

7. Credential expiry mid-session
- Fix: re-authenticate and rerun `make doctor` before retrying lifecycle commands.

8. Throttling / transient AWS errors
- Fix: wait 15-30 seconds, retry command. Reduce parallel retries if you scripted extra calls.

9. `CEW_MOCK_AWS` points to the wrong mode
- Fix: run `unset CEW_MOCK_AWS` (or `export CEW_MOCK_AWS=0`) for real AWS workshop flow.

10. `make install` fails before dependencies install
- Fix: ensure `python3 --version` is 3.10+ and `python3 -m venv --help` works, then rerun `make install`.
