# AWS SA Cheat Sheet

Use these commands during workshop support.

## Set Context

```bash
export AWS_REGION=<workshop-region>
export AWS_DEFAULT_REGION=$AWS_REGION
export GRAPH_NODES_TABLE=GraphNodes
export GRAPH_EDGES_TABLE=GraphEdges
export ARTIFACT_BUCKET=<workshop-bucket>
```

## 1) STS Identity

```bash
aws sts get-caller-identity
```

Expected:
- returns `Account`, `Arn`, `UserId`.

If fails:
- verify session token validity
- re-run SSO login or rotate temporary creds

## 2) Bedrock Access / Enablement

Check account/model visibility:

```bash
aws bedrock list-foundation-models --by-output-modality TEXT --region "$AWS_REGION"
```

Optional invoke smoke check (example payload file required):

```bash
cat > /tmp/bedrock-test.json <<'JSON'
{
  "anthropic_version": "bedrock-2023-05-31",
  "max_tokens": 64,
  "messages": [{"role": "user", "content": "Reply with: bedrock-ok"}]
}
JSON

aws bedrock-runtime invoke-model \
  --region "$AWS_REGION" \
  --model-id anthropic.claude-3-haiku-20240307-v1:0 \
  --content-type application/json \
  --accept application/json \
  --body fileb:///tmp/bedrock-test.json \
  /tmp/bedrock-out.json
```

If Bedrock is not enabled for workshop baseline:
- set `BEDROCK_ENABLED=0` and use fallback summarizer.

## 3) DynamoDB Table Existence

```bash
aws dynamodb describe-table --table-name "$GRAPH_NODES_TABLE" --region "$AWS_REGION"
aws dynamodb describe-table --table-name "$GRAPH_EDGES_TABLE" --region "$AWS_REGION"
```

Quick R/W probe (low impact):

```bash
PROBE_ID="sa-probe-$(date +%s)"
aws dynamodb put-item \
  --table-name "$GRAPH_NODES_TABLE" \
  --region "$AWS_REGION" \
  --item "{\"node_id\":{\"S\":\"$PROBE_ID\"},\"type\":{\"S\":\"DoctorProbe\"},\"session_id\":{\"S\":\"sa-check\"},\"validated\":{\"BOOL\":true},\"created_at\":{\"S\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"},\"updated_at\":{\"S\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"},\"data\":{\"M\":{\"probe\":{\"S\":\"ok\"}}}}"

aws dynamodb get-item \
  --table-name "$GRAPH_NODES_TABLE" \
  --region "$AWS_REGION" \
  --key "{\"node_id\":{\"S\":\"$PROBE_ID\"}}"
```

## 4) S3 Write Test

```bash
echo "sa-write-check" > /tmp/sa-write-check.txt
aws s3api put-object \
  --bucket "$ARTIFACT_BUCKET" \
  --key "workshop-artifacts/sa-check/sa-write-check.txt" \
  --body /tmp/sa-write-check.txt \
  --region "$AWS_REGION"
```

Verify object:

```bash
aws s3api head-object \
  --bucket "$ARTIFACT_BUCKET" \
  --key "workshop-artifacts/sa-check/sa-write-check.txt" \
  --region "$AWS_REGION"
```

## Common IAM / Region Fixes

1. STS failure
- Allow `sts:GetCallerIdentity`.

2. DDB access denied
- Allow `dynamodb:DescribeTable`, `GetItem`, `PutItem`, `UpdateItem`, `Scan`, `Query` on `GraphNodes` and `GraphEdges`.

3. S3 access denied
- Allow `s3:ListBucket` on bucket and `s3:PutObject/GetObject/HeadObject` on workshop prefix.

4. Wrong region symptoms
- Resources appear missing despite existing.
- Fix by forcing explicit `--region` and setting `AWS_REGION` + `AWS_DEFAULT_REGION`.

5. Bedrock access denied
- Enable model access in the account/region and allow `bedrock:ListFoundationModels` + runtime invoke permissions.

6. Temporary creds expired
- Refresh SSO/session token and re-run `aws sts get-caller-identity`.

