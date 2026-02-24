# Facilitator Runbook

Workshop length: 90 minutes.

## Minute-by-Minute Script

0-5 min: kickoff
- Say: "Today we will run a real PLAN->ACT->VERIFY loop on AWS and prove evidence promotion in the context pack."
- Attendees run:

```bash
pwd
ls
```

5-15 min: environment setup
- Say: "Set region and credentials first; everything else depends on this."
- Attendees run:

```bash
export AWS_REGION=<workshop-region>
export AWS_DEFAULT_REGION=$AWS_REGION
aws sts get-caller-identity
```

15-25 min: repo bootstrap
- Say: "Install once, then we validate infra access."
- Attendees run:

```bash
export CEW_GRAPH_NODES_TABLE=GraphNodes
export CEW_GRAPH_EDGES_TABLE=GraphEdges
export CEW_ARTIFACT_BUCKET=<workshop-bucket>
export BEDROCK_ENABLED=0
unset CEW_MOCK_AWS
make install
make doctor
```

25-40 min: first smoke pass
- Say: "Smoke is the golden path; it should fail loudly if anything is wrong."
- Attendees run:

```bash
make smoke
```

- Ask attendees to keep their `session_id` from smoke output.

40-55 min: inspect outputs
- Say: "Now inspect the context pack and evidence files produced by smoke."
- Attendees run:

```bash
ls -l context_pack_before.json context_pack_after.json context_pack.json
cat context_pack_before.json
cat context_pack_after.json
```

55-70 min: context compiler strategies
- Say: "Compare strategy behavior. RECITE is recency-first. GRAPH_FIRST is graph traversal + ranking."
- Attendees run:

```bash
make compile STRATEGY=recite SESSION=<session_id> TASK="review verification evidence"
cat context_pack.json
make compile STRATEGY=graph_first SESSION=<session_id> TASK="review verification evidence"
cat context_pack.json
```

70-80 min: troubleshooting block
- Say: "If you are blocked, classify your issue first: identity, region, IAM, or resources."
- Have each blocked attendee run:

```bash
aws sts get-caller-identity
aws dynamodb describe-table --table-name GraphNodes
aws dynamodb describe-table --table-name GraphEdges
aws s3api head-bucket --bucket <workshop-bucket>
```

80-90 min: wrap and evidence review
- Say: "Success criteria: doctor pass, smoke pass, and changed context pack after verify evidence."
- Attendees run:

```bash
grep -n "SMOKE PASS" -n logs/* 2>/dev/null || true
```

## What to Say at Each Checkpoint

CP0 (setup):
- "Region + identity first. No credentials, no progress."

CP1 (doctor):
- "Doctor must pass before smoke; do not skip."

CP2 (smoke):
- "Smoke is intentionally strict; the failure stage is your roadmap."

CP3 (compiler):
- "Selection reasons explain why each context item was included."

CP4 (verify):
- "Validated verification evidence should change what gets selected."

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

