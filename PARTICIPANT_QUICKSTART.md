# Participant Quickstart

Goal: get from login to a successful smoke run.

## 1) Login

Choose one path.

Local terminal:
- Use your normal AWS access method (`aws configure`, SSO, or workshop-issued temporary creds).

CloudShell:
- Open AWS Console -> CloudShell.
- Credentials are pre-wired; do not run `aws configure` unless instructed.

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
export BEDROCK_ENABLED=0
unset CEW_MOCK_AWS
```

## 5) Run Commands

From repo root:

```bash
make install
make doctor
make smoke
```

Expected:
- `make doctor` prints `PASS: doctor checks complete`.
- `make smoke` prints `SMOKE PASS` and a `session_id`.

## 6) Top 10 Errors and Fixes

1. `AccessDenied` on STS/DynamoDB/S3
- Fix: ask facilitator/SA to attach workshop policy for `sts:GetCallerIdentity`, DynamoDB R/W on `GraphNodes`/`GraphEdges`, and S3 write on workshop bucket/prefix.

2. Wrong region / missing region
- Fix: export both:
  - `export AWS_REGION=<workshop-region>`
  - `export AWS_DEFAULT_REGION=$AWS_REGION`

3. `Bedrock access check failed`
- Fix: set `export BEDROCK_ENABLED=0` for workshop baseline, or ask SA to enable Bedrock model access + IAM permissions.

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
- Fix: re-authenticate and rerun `make doctor` before retrying `make smoke`.

8. Throttling / transient AWS errors
- Fix: wait 15-30 seconds, retry command. Reduce parallel retries if you scripted extra calls.

9. `CEW_MOCK_AWS=1 is not allowed for real smoke`
- Fix: run `unset CEW_MOCK_AWS` (or `export CEW_MOCK_AWS=0`) and rerun `make smoke`.

10. `aws` command or Python missing
- Fix: install AWS CLI v2 and Python 3.10+, then rerun `make install`.

