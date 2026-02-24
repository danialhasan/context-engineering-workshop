# Context Engineering Workshop Spec (MVP for Readiness Freeze)

## 1) Outcomes (Measurable)

By the end of the 90-minute workshop, each attendee can:

1. Run `make doctor` successfully in a fresh AWS workshop account.
2. Run `make smoke` successfully and complete one PLAN -> ACT -> VERIFY cycle.
3. Show persisted evidence:
   - graph metadata and receipts in DynamoDB
   - large artifacts in S3
4. Use `aws_tool` (JSON in/out) without invoking raw `aws` commands through the agent path.
5. Compare summarization behavior with Bedrock enabled and disabled (fallback path still passes).

Lecture outcome (60-minute block):

1. Attendees can explain the five primitives and how they compose:
   - ontology
   - context graph
   - skill graph
   - context compiler
   - orchestrator loop with verification gating

## 2) Constraints (MVP Scope)

- Time-boxed for a single 90-minute hands-on session.
- Maximum checkpoints: CP0-CP4.
- Maximum skills: 6-8 (this spec defines 7).
- Allowed AWS primitives only:
  - DynamoDB
  - S3
  - Bedrock (optional)
  - IAM/STS (assumed for auth/role)
- No extra AWS services introduced.
- Bedrock cannot be required for passing smoke tests.
- Agent-facing execution uses `aws_tool` only (strict validation, JSON contracts, receipts).

## 3) AWS Primitives Used

### DynamoDB

- `cew_graph` table:
  - stores nodes and edges for ontology/context graph.
- `cew_receipts` table:
  - stores execution receipts, verification status, and pointers to artifacts.

### S3

- `cew-artifacts-<account>-<region>` bucket:
  - stores large logs, transcripts, diffs, and other evidence blobs.

### Bedrock (Optional)

- Used only by `summarize_evidence` when configured.
- If unavailable, fallback summarizer must preserve output schema.

### IAM/STS (Assumed)

- `sts:GetCallerIdentity` confirms account and role.
- least-privilege role for DynamoDB/S3 and optional Bedrock invoke.

## 4) Repo Layout (Planned)

```text
.
├── WORKSHOP_SPEC.md
├── Makefile
├── README.md
├── docs/
│   ├── lecture/60min-outline.md
│   ├── workshop/90min-lab.md
│   └── runbooks/readiness-freeze.md
├── src/
│   ├── aws_tool/
│   │   ├── cli.py
│   │   ├── allowlist.py
│   │   ├── schemas.py
│   │   └── receipts.py
│   ├── graph/
│   │   ├── ontology.py
│   │   ├── context_graph.py
│   │   └── compiler.py
│   ├── skills/
│   │   └── registry.py
│   ├── orchestrator/
│   │   └── loop.py
│   └── summarizer/
│       ├── bedrock.py
│       └── fallback.py
├── tests/
│   ├── doctor/
│   ├── smoke/
│   └── fixtures/
└── scripts/
    └── seed_workshop_data.py
```

## 5) Ontology (Minimal)

### Node Types

1. `Run`
- One orchestrator attempt, scoped by `run_id`.

2. `SkillExecution`
- One skill invocation with input/output snapshots.

3. `Receipt`
- Immutable execution evidence record.

4. `Artifact`
- Large payload reference (usually S3 object).

5. `Claim`
- Verifiable statement derived from evidence.

### Edge Types

1. `RUN_HAS_STEP` (`Run -> SkillExecution`)
2. `STEP_EMITS_RECEIPT` (`SkillExecution -> Receipt`)
3. `RECEIPT_POINTS_TO` (`Receipt -> Artifact`)
4. `CLAIM_SUPPORTED_BY` (`Claim -> Receipt`)
5. `RUN_ASSERTS` (`Run -> Claim`)

### Constraints (exactly 3)

1. Every `SkillExecution` must have exactly one parent `Run`.
2. Every `Receipt` must include `status`, `ts_utc`, and `checksum`; receipts above size threshold must point to an `Artifact`.
3. Every `Claim` in `verified` state must have at least one `CLAIM_SUPPORTED_BY` edge to a `Receipt` with `status=success`.

## 6) Skill Set (7 Skills Total)

All skills are typed and execute AWS actions only through `aws_tool` allowlisted operations.

### Skill 1: `resolve_identity`

- Input schema:
```json
{
  "type": "object",
  "required": ["run_id"],
  "properties": {
    "run_id": {"type": "string"}
  }
}
```
- Output schema:
```json
{
  "type": "object",
  "required": ["account_id", "arn", "user_id", "receipt_id"],
  "properties": {
    "account_id": {"type": "string"},
    "arn": {"type": "string"},
    "user_id": {"type": "string"},
    "receipt_id": {"type": "string"}
  }
}
```
- AWS calls triggered:
  - `sts:GetCallerIdentity`
  - `dynamodb:PutItem` (receipt)

### Skill 2: `upsert_node`

- Input schema:
```json
{
  "type": "object",
  "required": ["run_id", "node_type", "node_id", "payload"],
  "properties": {
    "run_id": {"type": "string"},
    "node_type": {"type": "string", "enum": ["Run", "SkillExecution", "Receipt", "Artifact", "Claim"]},
    "node_id": {"type": "string"},
    "payload": {"type": "object"}
  }
}
```
- Output schema:
```json
{
  "type": "object",
  "required": ["node_pk", "node_sk", "version", "receipt_id"],
  "properties": {
    "node_pk": {"type": "string"},
    "node_sk": {"type": "string"},
    "version": {"type": "integer"},
    "receipt_id": {"type": "string"}
  }
}
```
- AWS calls triggered:
  - `dynamodb:PutItem` / `dynamodb:UpdateItem` (`cew_graph`)
  - `dynamodb:PutItem` (`cew_receipts`)

### Skill 3: `link_edge`

- Input schema:
```json
{
  "type": "object",
  "required": ["run_id", "from_id", "to_id", "edge_type"],
  "properties": {
    "run_id": {"type": "string"},
    "from_id": {"type": "string"},
    "to_id": {"type": "string"},
    "edge_type": {"type": "string", "enum": ["RUN_HAS_STEP", "STEP_EMITS_RECEIPT", "RECEIPT_POINTS_TO", "CLAIM_SUPPORTED_BY", "RUN_ASSERTS"]}
  }
}
```
- Output schema:
```json
{
  "type": "object",
  "required": ["edge_id", "receipt_id"],
  "properties": {
    "edge_id": {"type": "string"},
    "receipt_id": {"type": "string"}
  }
}
```
- AWS calls triggered:
  - `dynamodb:PutItem` (`cew_graph`)
  - `dynamodb:PutItem` (`cew_receipts`)

### Skill 4: `store_artifact`

- Input schema:
```json
{
  "type": "object",
  "required": ["run_id", "artifact_type", "content"],
  "properties": {
    "run_id": {"type": "string"},
    "artifact_type": {"type": "string", "enum": ["log", "diff", "transcript", "json"]},
    "content": {"type": "string"}
  }
}
```
- Output schema:
```json
{
  "type": "object",
  "required": ["s3_uri", "etag", "bytes", "artifact_id", "receipt_id"],
  "properties": {
    "s3_uri": {"type": "string"},
    "etag": {"type": "string"},
    "bytes": {"type": "integer"},
    "artifact_id": {"type": "string"},
    "receipt_id": {"type": "string"}
  }
}
```
- AWS calls triggered:
  - `s3:PutObject`
  - `dynamodb:PutItem` (`cew_graph`, `cew_receipts`)

### Skill 5: `record_receipt`

- Input schema:
```json
{
  "type": "object",
  "required": ["run_id", "skill_name", "status", "summary"],
  "properties": {
    "run_id": {"type": "string"},
    "skill_name": {"type": "string"},
    "status": {"type": "string", "enum": ["success", "failure"]},
    "summary": {"type": "string"},
    "artifact_uri": {"type": "string"}
  }
}
```
- Output schema:
```json
{
  "type": "object",
  "required": ["receipt_id", "ts_utc"],
  "properties": {
    "receipt_id": {"type": "string"},
    "ts_utc": {"type": "string"}
  }
}
```
- AWS calls triggered:
  - `dynamodb:PutItem` (`cew_receipts`)

### Skill 6: `compile_context_pack`

- Input schema:
```json
{
  "type": "object",
  "required": ["run_id", "max_items", "byte_budget"],
  "properties": {
    "run_id": {"type": "string"},
    "max_items": {"type": "integer", "minimum": 1, "maximum": 20},
    "byte_budget": {"type": "integer", "minimum": 1024}
  }
}
```
- Output schema:
```json
{
  "type": "object",
  "required": ["pack_id", "items", "used_bytes", "dropped_count"],
  "properties": {
    "pack_id": {"type": "string"},
    "items": {"type": "array"},
    "used_bytes": {"type": "integer"},
    "dropped_count": {"type": "integer"}
  }
}
```
- AWS calls triggered:
  - `dynamodb:Query` (`cew_graph`, `cew_receipts`)
  - `s3:GetObject` (when artifact-backed evidence is needed)
  - `dynamodb:PutItem` (`cew_receipts`)

### Skill 7: `summarize_evidence`

- Input schema:
```json
{
  "type": "object",
  "required": ["run_id", "evidence_refs"],
  "properties": {
    "run_id": {"type": "string"},
    "evidence_refs": {"type": "array", "items": {"type": "string"}},
    "max_chars": {"type": "integer", "minimum": 200, "maximum": 4000}
  }
}
```
- Output schema:
```json
{
  "type": "object",
  "required": ["summary", "provider", "receipt_id"],
  "properties": {
    "summary": {"type": "string"},
    "provider": {"type": "string", "enum": ["bedrock", "fallback"]},
    "receipt_id": {"type": "string"}
  }
}
```
- AWS calls triggered:
  - Optional `bedrock:InvokeModel`
  - `s3:GetObject` (if evidence refs point to S3 artifacts)
  - `dynamodb:PutItem` (`cew_receipts`)

## 7) Checkpoints (CP0-CP4 for 90 Minutes)

Total lab target: 90 minutes.

### CP0 (10 min): Environment Doctor

- Commands attendees run:
```bash
make doctor
```
- Pass criteria:
  - exit code `0`
  - shows valid `account_id`, `region`, and required env vars
  - confirms access to planned DynamoDB tables and S3 bucket names (or creatable)
- Fail criteria:
  - non-zero exit
  - missing credentials/region/role
  - permission denied for required IAM actions

### CP1 (15 min): Resource Bootstrap

- Commands attendees run:
```bash
make aws-init
make aws-check
```
- Pass criteria:
  - `cew_graph` and `cew_receipts` tables exist
  - workshop S3 bucket exists and is writable
  - outputs are idempotent (re-run produces no destructive drift)
- Fail criteria:
  - resources missing after init
  - write test fails

### CP2 (20 min): Ontology + Context Graph Seed

- Commands attendees run:
```bash
make seed-graph
make verify-graph
```
- Pass criteria:
  - required node types and edge types are present
  - all 3 ontology constraints validate
  - receipts are present for seed operations
- Fail criteria:
  - invalid edge type or orphan node
  - missing mandatory receipt fields
  - constraint validation returns false

### CP3 (20 min): Skills + Context Compiler

- Commands attendees run:
```bash
make run-skills
make compile-context
make verify-context-pack
```
- Pass criteria:
  - at least one successful receipt per skill in scope
  - compiled pack respects `max_items` and `byte_budget`
  - deterministic pack hash for same fixture input
- Fail criteria:
  - any skill emits schema-invalid output
  - budget overflow or nondeterministic pack ordering

### CP4 (25 min): Orchestrator Smoke (PLAN -> ACT -> VERIFY)

- Commands attendees run:
```bash
make smoke
BEDROCK_ENABLED=0 make smoke
```
- Pass criteria:
  - both commands exit `0`
  - verification gate blocks bad claims and allows valid claims
  - final run emits receipts and artifact pointers
- Fail criteria:
  - smoke fails in either mode
  - fallback summarizer output contract differs from Bedrock mode

## 8) Readiness Freeze Definition (Tomorrow)

By **Wednesday, February 25, 2026**, freeze is achieved only if:

1. Workshop flow is stable across CP0-CP4 with no missing steps.
2. `aws_tool` is the only agent-facing AWS execution path and enforces allowlist + strict JSON validation.
3. DynamoDB and S3 persistence is proven in smoke receipts.
4. Bedrock optional path and fallback path both pass smoke.
5. 60-minute lecture outline and 90-minute lab guide are aligned to this spec.

## 9) Definition of Done

Done means, in a fresh AWS workshop account:

1. `make doctor` passes.
2. `make smoke` passes.
