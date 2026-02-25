# AWS SA Cheat Sheet

Use this during workshop support and escalation triage.

## Set Context

Use the same environment variable names as the repo:

```bash
export AWS_REGION=<workshop-region>
export AWS_DEFAULT_REGION=$AWS_REGION
export CEW_GRAPH_NODES_TABLE=GraphNodes
export CEW_GRAPH_EDGES_TABLE=GraphEdges
export CEW_ARTIFACT_BUCKET=<workshop-bucket>
export BEDROCK_ENABLED=0
```

Region note:
- Keep DynamoDB tables and S3 bucket in the same region as `AWS_REGION`.
- The code uses `AWS_REGION`/`AWS_DEFAULT_REGION` for boto3 clients.

## Required IAM Actions (Minimum)

For baseline workshop success (`make doctor`, `make smoke`, `make compile`):

- STS:
  - `sts:GetCallerIdentity`
- DynamoDB on both workshop tables (`GraphNodes`, `GraphEdges`):
  - `dynamodb:DescribeTable`
  - `dynamodb:GetItem`
  - `dynamodb:PutItem`
  - `dynamodb:UpdateItem`
  - `dynamodb:Scan`
- S3:
  - `s3:ListBucket` on the workshop bucket
  - `s3:PutObject`
  - `s3:GetObject`
- Optional Bedrock (only when `BEDROCK_ENABLED=1`):
  - `bedrock:ListFoundationModels`
  - `bedrock:InvokeModel`

## DynamoDB Table Assumptions

The current code assumes:

- `GraphNodes`
  - partition key: `node_id` (String)
- `GraphEdges`
  - partition key: `edge_id` (String)

Important:
- Graph traversal uses `Scan` filters on `from_id` and `to_id`.
- If `Scan` is denied, doctor/smoke will fail even when `PutItem` succeeds.

## Fast Triage Checks

### 1) Identity

```bash
aws sts get-caller-identity --region "$AWS_REGION"
```

### 2) Table Existence

```bash
aws dynamodb describe-table --table-name "$CEW_GRAPH_NODES_TABLE" --region "$AWS_REGION"
aws dynamodb describe-table --table-name "$CEW_GRAPH_EDGES_TABLE" --region "$AWS_REGION"
```

### 3) Key Schema Confirmation

```bash
aws dynamodb describe-table --table-name "$CEW_GRAPH_NODES_TABLE" --region "$AWS_REGION" \
  --query 'Table.KeySchema'

aws dynamodb describe-table --table-name "$CEW_GRAPH_EDGES_TABLE" --region "$AWS_REGION" \
  --query 'Table.KeySchema'
```

Expected:
- GraphNodes key schema contains `node_id` as `HASH`.
- GraphEdges key schema contains `edge_id` as `HASH`.

### 4) DynamoDB R/W Probe (Nodes + Edges)

```bash
NOW="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
NODE_ID="sa-probe-node-$(date +%s)"
EDGE_ID="sa-probe-edge-$(date +%s)"

aws dynamodb put-item \
  --table-name "$CEW_GRAPH_NODES_TABLE" \
  --region "$AWS_REGION" \
  --item "{\"node_id\":{\"S\":\"$NODE_ID\"},\"type\":{\"S\":\"DoctorProbe\"},\"session_id\":{\"S\":\"sa-check\"},\"validated\":{\"BOOL\":true},\"created_at\":{\"S\":\"$NOW\"},\"updated_at\":{\"S\":\"$NOW\"},\"data\":{\"M\":{\"probe\":{\"S\":\"ok\"}}}}"

aws dynamodb get-item \
  --table-name "$CEW_GRAPH_NODES_TABLE" \
  --region "$AWS_REGION" \
  --key "{\"node_id\":{\"S\":\"$NODE_ID\"}}"

aws dynamodb put-item \
  --table-name "$CEW_GRAPH_EDGES_TABLE" \
  --region "$AWS_REGION" \
  --item "{\"edge_id\":{\"S\":\"$EDGE_ID\"},\"from_id\":{\"S\":\"$NODE_ID\"},\"to_id\":{\"S\":\"$NODE_ID\"},\"edge_type\":{\"S\":\"doctor_probe\"},\"session_id\":{\"S\":\"sa-check\"},\"created_at\":{\"S\":\"$NOW\"}}"
```

### 5) S3 Write Probe

```bash
echo "sa-write-check" > /tmp/sa-write-check.txt
aws s3api put-object \
  --bucket "$CEW_ARTIFACT_BUCKET" \
  --key "workshop-artifacts/sa-check/sa-write-check.txt" \
  --body /tmp/sa-write-check.txt \
  --region "$AWS_REGION"

aws s3api head-object \
  --bucket "$CEW_ARTIFACT_BUCKET" \
  --key "workshop-artifacts/sa-check/sa-write-check.txt" \
  --region "$AWS_REGION"
```

### 6) Optional Bedrock Visibility Check

```bash
aws bedrock list-foundation-models --by-output-modality TEXT --region "$AWS_REGION"
```

If Bedrock is not part of baseline for participants, keep:

```bash
export BEDROCK_ENABLED=0
```

## Common Fixes

1. STS failure
- Re-authenticate credentials and verify role trust/session validity.

2. DDB `AccessDenied`
- Grant `DescribeTable/GetItem/PutItem/UpdateItem/Scan` on both workshop tables.

3. S3 `AccessDenied`
- Grant `ListBucket` on bucket and `PutObject/GetObject` on workshop prefix.

4. Resource not found but exists
- Region mismatch. Re-export `AWS_REGION` and `AWS_DEFAULT_REGION`, then retry with explicit `--region`.

5. Bedrock denied
- Keep `BEDROCK_ENABLED=0` for baseline, or enable model access and runtime permissions.
