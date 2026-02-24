---
marp: true
theme: default
paginate: true
title: Context Engineering on AWS
description: 60-minute lecture aligned to the workshop implementation
---

<!-- _class: lead -->
# Context Engineering on AWS
## 60-minute lecture aligned to the 90-minute hands-on lab

- Runtime: DynamoDB + S3 (+ optional Bedrock)
- Interface: `aws_tool` with strict JSON contracts
- Goal: reliable golden path before readiness freeze

<!--
Speaker notes:
- Open with the promise: this lecture explains the exact model attendees will execute in lab.
- Emphasize "golden path over extras" and that every concept maps to a command.
-->

---

## Outcomes For This Hour

By the end of this lecture, attendees should be able to:

1. Explain the six primitives: state, artifacts, evidence, skills, compiler, policy.
2. Define ontology, context graph, and skill graph in this implementation.
3. Compare `RECITE` vs `GRAPH_FIRST` context compilation.
4. Explain verification gating (`PLAN -> ACT -> VERIFY`) and why it reduces hallucinated progress.
5. Run the before/after evidence demo script during workshop.

<!--
Speaker notes:
- Keep this as a contract for the next 60 minutes.
- Tie directly to workshop success criteria: make doctor, make smoke, and compile strategies.
-->

---

## Why Context Engineering (Practical Lens)

- LLM/tool loops fail when context is implicit, stale, or unverified.
- We make context explicit, typed, and evidence-backed.
- We separate:
  - state (`GraphNodes` / `GraphEdges` in DynamoDB)
  - artifacts (S3 blobs, logs, transcripts)
  - evidence (Receipt/TestResult nodes + links)
- Result: deterministic inspection and replay of agent behavior.

<!--
Speaker notes:
- Use concrete language: "What did we do? Where is proof? What is validated?"
- Stress that this is an operations pattern, not just a prompt trick.
-->

---

## Primitive Stack (Exactly What We Implemented)

1. **State**: graph nodes/edges in DynamoDB (`GraphNodes`, `GraphEdges`).
2. **Artifacts**: large outputs in S3 via artifact store.
3. **Evidence**: `Receipt`, `TestResult`, `Summary`, `Artifact` links.
4. **Skills**: YAML-defined tools, schema-validated, phase-gated.
5. **Compiler**: graph -> ranked, budgeted `context_pack.json`.
6. **Policy**: ontology constraints + phase gating + verification promotion.

<!--
Speaker notes:
- This is the mental model slide; revisit it when attendees get lost.
- Mention that all six are visible in repo code and command outputs.
-->

---

## AWS As Primitives Layer

- **DynamoDB**:
  - `GraphNodes`: typed entities (Session, SkillCall, Receipt, Artifact, Task, Plan, TestResult...)
  - `GraphEdges`: typed relationships (produces, references, plans_for, verified_by, evidence_for...)
- **S3**:
  - artifact payloads and logs from skill calls (stdout/stderr/log sections)
- **Bedrock (optional)**:
  - used for compaction summaries when available
  - skipped cleanly with fallback message when unavailable
- **IAM/STS assumed**:
  - identity + permissions validated by `make doctor`

<!--
Speaker notes:
- Clarify that Bedrock is explicitly optional in this build.
- If asked about extra AWS services: out of scope for MVP.
-->

---

## Ontology + Context Graph Definitions

- Ontology file: `ontology/ontology.yml`
- Core node types include:
  - `Objective`, `Plan`, `Task`, `SkillCall`, `Receipt`, `Artifact`, `TestResult`, `Summary`, `Error`
- Core edge types include:
  - `performed_by`, `produces`, `references`, `plans_for`, `verified_by`, `evidence_for`, `caused_by`
- Constraint examples:
  - `skill_execution_parent_run`
  - `receipt_required_fields`
  - `verified_claim_support`
- Writes are validated against ontology + best-effort constraints.

<!--
Speaker notes:
- Define "context graph" as runtime truth, not speculative memory.
- Mention provenance: each skill call emits a traceable chain in graph + S3.
-->

---

## Skill Graph + Safe Tool Wrapper

- Skill definitions live in `skills/*.yml` (7 skills in MVP).
- Wrapper CLI:
  - `aws_tool list-skills`
  - `aws_tool run <skill_name> --json '<payload>' --session <id> --phase <PLAN|ACT|VERIFY>`
- Safety and control:
  - input schema validation
  - phase gating enforcement
  - allowlisted implementations only
  - `subprocess` execution without `shell=True` for AWS CLI paths
- Automatic provenance per invocation:
  - `SkillCall` node
  - `Receipt` node
  - optional `Artifact` node (logs/outputs)
  - linking edges (+ `Error` + `caused_by` on failure)

<!--
Speaker notes:
- Important policy statement: agent uses aws_tool contract, not raw aws command surface.
- This is how we get auditability and stable interfaces for workshop users.
-->

---

## Compiler Strategy A: `RECITE`

- Purpose: stable, fast pack for tight iteration.
- Selection behavior:
  - include latest receipts window (`N`)
  - include latest verification evidence window
  - append **Objective** and **Latest Plan** at end (recency placement)
- Budgeting:
  - estimate tokens per item
  - keep only items within token budget
- Output shape:
  - `selected_items`
  - `selection_reason`
  - `allowed_skills` for current phase
  - `token_estimate`

<!--
Speaker notes:
- Use RECITE as the default workshop strategy because it is easy to explain and debug.
- Highlight "selection_reason" as a teaching tool for why context changed.
-->

---

## Compiler Strategy B: `GRAPH_FIRST`

- Purpose: relationship-aware selection for richer contexts.
- Traversal:
  - start from `Task` / `Objective` seeds
  - traverse graph to depth 2
- Ranking priorities:
  - validated > unvalidated
  - linked-to-task > unlinked
  - recency
  - type priority (`Objective/Plan/Decision/Receipt/TestResult` above raw logs)
- Packing:
  - include summaries and S3 pointers over raw blobs
  - enforce token budget

<!--
Speaker notes:
- Emphasize that this feels smarter because structure influences ranking.
- If time is tight, compare one concrete item that GRAPH_FIRST includes/excludes differently than RECITE.
-->

---

## Verification Gating (Why It Matters)

- Loop policy: `PLAN -> ACT -> VERIFY`
- Gating rule: progress is promoted when evidence exists and is linked.
- In smoke flow:
  - PLAN writes `Task` + `Plan` update
  - ACT writes `Receipt` + `Artifact`
  - VERIFY writes validated `TestResult` + evidence edges
- Outcome:
  - post-VERIFY context packs prioritize validated evidence
  - selection reasons explicitly show promotion (`validated-promoted`, verification window)

<!--
Speaker notes:
- This is the anti-self-deception slide: no evidence, no promotion.
- Connect to real incidents where unverified "done" caused production failures.
-->

---

## Demo Script: Before vs After Verification Evidence

```bash
make install
make doctor
make smoke
```

`make smoke` emits:
- `context_pack_before.json`
- `context_pack_after.json`
- `session_id` for inspection

Then compare:

```bash
jq '.selected_items[] | {id,type,validated,selection_reason}' context_pack_before.json
jq '.selected_items[] | {id,type,validated,selection_reason}' context_pack_after.json
```

Expected demo result:
- `TestResult` appears after VERIFY
- validated item count increases
- selection reasons show verification-driven promotion

<!--
Speaker notes:
- Live-narrate what "changed in pack" means: better context quality, not just more context.
- If jq is unavailable, open both files side-by-side and inspect selected_items.
-->

---

## Readiness Freeze Checklist (Tomorrow)

- `make doctor` passes in fresh workshop account.
- `make smoke` passes end-to-end against AWS (non-mock).
- `aws_tool` list/run commands work with schema + phase enforcement.
- DynamoDB + S3 evidence chain is inspectable for smoke session.
- `make compile` works for both:
  - `STRATEGY=recite`
  - `STRATEGY=graph_first`
- Bedrock absence does not break golden path (fallback/skip is explicit).

Definition of done:
- Fresh attendee account can execute doctor + smoke and show context promotion after VERIFY.

<!--
Speaker notes:
- Close by mapping lecture concepts to operational go/no-go.
- Transition to workshop: "Now we run the same model ourselves in 90 minutes."
-->
