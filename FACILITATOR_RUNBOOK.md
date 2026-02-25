# Facilitator Runbook

Workshop length: 90 minutes.

## Minute-by-Minute Script

0-5 min: kickoff
- Say: "Today we are building context systems for agents, not just running scripts."
- Say: "The workshop pattern is initializer -> coder, then single agent -> swarm."
- Attendees run:

```bash
pwd
ls
```

5-15 min: environment setup (keep this under 10 minutes)
- Say: "Set region and credentials first; everything else depends on this."
- Say: "CloudShell users must confirm Python 3.10+ before install. If lower, switch to local."
- Attendees run:

```bash
python3 --version
export AWS_REGION=<workshop-region>
export AWS_DEFAULT_REGION=$AWS_REGION
aws sts get-caller-identity
```

15-25 min: repo bootstrap + provisioning
- Say: "This is the initializer step. We start with scaffold + infra ready."
- Attendees run:

```bash
export BEDROCK_ENABLED=1
export BEDROCK_MODEL_ID=us.anthropic.claude-opus-4-6-v1
unset CEW_MOCK_AWS
make install
make provision
make doctor
./aws_tool list-skills
```

- Note: `make install` bootstraps `.venv` and make targets then run with `.venv/bin/python`.

25-40 min: single-agent lifecycle baseline
- Say: "Now we run one loop and prove evidence-gated promotion."
- Attendees run (copy/paste session id into every command):

```bash
SESSION="cew-$(date +%s)"
./aws_tool run create_task --session "$SESSION" --phase PLAN --json "{\"run_id\":\"$SESSION\",\"title\":\"Implement TODO and verify\"}"
./aws_tool run list_tasks --session "$SESSION" --phase PLAN --json "{\"run_id\":\"$SESSION\"}"
# copy task_id
./aws_tool run claim_task --session "$SESSION" --phase ACT --json "{\"run_id\":\"$SESSION\",\"task_id\":\"<task_id>\",\"agent_id\":\"coder-1\"}"
./aws_tool run upload_artifact --session "$SESSION" --phase ACT --json "{\"run_id\":\"$SESSION\",\"name\":\"implementation-notes.txt\",\"content\":\"baseline evidence\"}"
# copy s3_uri
./aws_tool run complete_task --session "$SESSION" --phase ACT --json "{\"run_id\":\"$SESSION\",\"task_id\":\"<task_id>\",\"agent_id\":\"coder-1\",\"summary\":\"Implemented TODO path\",\"artifact_uri\":\"<s3_uri>\",\"status\":\"success\"}"
./aws_tool run verify_task --session "$SESSION" --phase VERIFY --json "{\"run_id\":\"$SESSION\",\"task_id\":\"<task_id>\",\"check_type\":\"s3_head_object\",\"artifact_uri\":\"<s3_uri>\"}"
./aws_tool run neighbors --session "$SESSION" --phase VERIFY --json "{\"run_id\":\"$SESSION\",\"node_id\":\"<task_id>\",\"direction\":\"outbound\"}"
```

40-60 min: coder implementation pass (Anthropic initializer -> coder)
- Say: "Now attendees use their coding agent to complete scaffold TODOs with TDD."
- Say: "Retrieval is agent-invoked; context assembly is agent-native."
- Attendees run:

```bash
./aws_tool run search_nodes --session "$SESSION" --phase PLAN --json "{\"run_id\":\"$SESSION\",\"query\":\"evidence\",\"limit\":5}"
./aws_tool run get_node --session "$SESSION" --phase PLAN --json "{\"run_id\":\"$SESSION\",\"node_id\":\"<task_id>\"}"
./aws_tool run neighbors --session "$SESSION" --phase PLAN --json "{\"run_id\":\"$SESSION\",\"node_id\":\"<task_id>\",\"direction\":\"outbound\"}"
```

Coder instructions:
- implement one TODO at a time
- write or run a test for each TODO
- attach evidence artifacts/receipts
- do not promote without verify evidence

Verification ladder for facilitators:
- Level 1: schema/phase checks pass
- Level 2: deterministic checks pass (read-back/head/test command)
- Level 3: objective-level behavior confirmed with linked evidence

60-80 min: swarm lifecycle (same primitives, more coordination)
- Say: "Only coordination changes. Physics do not change."
- Ask attendees to run 3 agents against the same `SESSION`:
  - Planner: PLAN tools only
  - Worker: ACT tools only
  - Verifier: VERIFY tools only
- Require all done-claims to include `Receipt` + `Artifact` + `TestResult` linkage.

80-90 min: troubleshooting + wrap
- Say: "If you are blocked, classify your issue first: identity, region, IAM, or resources."
- Have each blocked attendee run:

```bash
aws sts get-caller-identity
aws dynamodb describe-table --table-name GraphNodes
aws dynamodb describe-table --table-name GraphEdges
aws s3api head-bucket --bucket <artifact-bucket>
```

## What to Say at Each Checkpoint

CP0 (setup):
- "Region + identity first. No credentials, no progress."

CP1 (doctor):
- "Doctor must pass before we build anything."

CP2 (tasks):
- "Tasks are the coordination currency. Receipts are the audit trail."

CP3 (coder pass):
- "Initializer gives scaffold; coder completes TODOs with TDD and evidence."

CP4 (verify):
- "No promotion without evidence. Unverified claims remain candidates, not trusted context."

## How to Group Stuck Participants

Group A: Identity/Auth issues
- Symptoms: STS failure, invalid token, expired creds.
- Helper: SA or facilitator for login refresh.

Group B: Region/config issues
- Symptoms: missing region, wrong-region resource not found.
- Helper: one facilitator confirms env vars and region consistency.

Group C: IAM permission issues
- Symptoms: `AccessDenied` on DDB/S3/Bedrock.
- Helper: SA applies policy fixes in batch.

Group D: Resource provisioning issues
- Symptoms: Graph tables or S3 bucket missing.
- Helper: facilitator provides correct names and validation commands.

## Fallback Plan: Shared Demo Mode

If some workshop accounts fail:
1. Facilitator runs commands on one known-good account and screen shares every command + output.
2. Blocked attendees pair with a working attendee (driver/navigator) and still complete command sequence.
3. Blocked attendees document expected outputs from shared run and compare with their own once fixed.
4. Keep everyone on the same checkpoint timing; do not let one subgroup drift too far ahead.

## Optional: Smoke Proof Artifact

If time allows, run the repo golden path:

```bash
make smoke
```
