# Workshop Agent Recontext Brief (Comprehensive)

Status: Active
Owner: Danial + supporting agents
Audience: Workshop implementation agent
Date: 2026-02-25

---

## 0) Purpose of This File

This document is the authoritative, comprehensive handoff for the workshop implementation track.

It defines:
- exactly what outcome we need,
- what exists now,
- what is missing,
- what to build next,
- what “done” means,
- and how to report understanding back to the user.

This workshop is **not** AWS-for-AWS’s-sake. AWS is infrastructure for context engineering primitives.

---

## 1) Outcome We Are Driving Toward

Deliver a **prebuilt, runnable, understandable multi-agent context-engineering harness** that attendees can:
1. run quickly,
2. inspect visually,
3. mutate safely,
4. and map directly to the lecture’s core mechanics.

### Product-level North Star

Attendees leave with a “glass case around the machine” where they can see:
- ontology structure,
- context graph state,
- task coordination,
- evidence receipts,
- verification gates,
- freshness/conflict handling,
- and swarm runtime loop behavior.

In short: **a visible system of context engineering for agent swarms**, not opaque scripts.

---

## 2) Final Workshop Experience (Target)

### Target attendee flow

1. Environment and credential setup succeeds in ~10 minutes.
2. Attendee runs a prebuilt harness with one command path.
3. Attendee opens a local UI (“glass case”) that visualizes all primitives.
4. Attendee runs single-agent and swarm scenarios.
5. Attendee performs guided mutations (safe edits/config toggles) and observes behavior changes.
6. Attendee verifies outcomes with receipts/evidence and sees promotion gates in action.

### Teaching posture

- We are not asking attendees to build everything from scratch during the workshop.
- Core system is prebuilt.
- Lab emphasizes execution, inspection, mutation, and interpretation.

---

## 3) Architectural Positioning (Aligned to Lecture)

Context engineering = systems engineering for attention.

System responsibilities:
- define shared meaning (ontology),
- persist and retrieve evidence-bearing state (memory/graph),
- constrain capability usage (tools + role/phase rights),
- support runtime context assembly behavior,
- gate trust with verification before promotion.

Swarms do not change theory; they increase coordination pressure.

---

## 4) What We Have Right Now (Grounded Inventory)

### 4.1 Core code surfaces present

- `src/tools/doctor.py`
  - Infra readiness checks (auth, region, DDB/S3 access, optional Bedrock).

- `src/tools/provision.py`
  - Provisioning path for graph tables and artifact bucket.

- `src/tools/smoke.py`
  - Golden-path integration exercise (task/evidence/verification style flow).

- `src/tools/compile_context.py`
  - Deterministic compile baseline entrypoint.

- `src/graph/context_graph.py`
  - Context graph state operations.

- `src/graph/compiler.py`
  - Deterministic compile strategies (`recite`, `graph_first`) baseline.

- `src/aws_tool/dispatcher.py` + `src/aws_tool/cli.py`
  - Tool contract + phase-gated execution surfaces.

- `src/orchestrator/loop.py` + `src/orchestrator/bedrock_harness.py`
  - Harness/orchestration path.

- `src/tools/harness_gui_server.py`
  - GUI server entrypoint for workshop-side UI.

### 4.2 Workshop docs present

- `docs/workshop/harness-prd.md`
  - Target shape, primitives, lifecycle language.

- `docs/workshop/implementation-delta.md`
  - Shift from deterministic-final assembly toward agent-native assembly posture.

- `docs/workshop/90min-lab.md`
  - Command-oriented lab checkpoints (single-agent -> swarm).

### 4.3 Existing strengths

- Good CLI/control-plane foundation.
- Evidence-oriented task flow already exists (claim/complete/verify patterns).
- Deterministic baseline useful as control comparison.
- AWS readiness path already established.

---

## 5) What Is Missing (Need vs Have)

## 5.1 Need vs Have Matrix

### A) Prebuilt lab usability
- Have:
  - operational commands and flows.
- Need:
  - one cohesive, low-friction workshop run path that is visibly narrative-driven.

### B) Glass-case visualization
- Have:
  - GUI server scaffolding.
- Need:
  - explicit UI panes mapped to primitives and swarm mechanics (see section 7).

### C) Swarm mechanics observability
- Have:
  - command-level task/claim/verify model.
- Need:
  - first-class visual state for queue/claim/lease/timeout/reassign + conflict/freshness.

### D) Verification semantics clarity
- Have:
  - verification commands and evidence linkage.
- Need:
  - visible promotion gates and trust tiers in UI + docs.

### E) Scenario-guided workshop path
- Have:
  - command snippets and checkpoints.
- Need:
  - concrete guided scenarios with expected outputs and “what to observe.”

### F) Mutation exercises
- Have:
  - architecture that can be toggled.
- Need:
  - curated safe mutations (e.g. disable verification gate, widen tool rights) with predicted failure modes.

---

## 6) Non-Negotiable Product Requirements

1. Must run on attendee laptops with workshop-provided AWS credentials.
2. Must preserve core trust rule: **no promotion without evidence**.
3. Must support both single-agent and swarm scenarios.
4. Must expose internals visually (not black-box execution).
5. Must make failure modes visible and explainable.
6. Must remain compact enough to teach in one session.

---

## 7) Required Glass-Case UI (Minimum Feature Set)

The UI is a teaching surface, not cosmetic chrome. It must answer “what is happening and why?”

### Panel 1: Runtime Timeline
Show chronological events with typed records:
- plan creation,
- task creation,
- claim,
- tool call,
- receipt emitted,
- verification run,
- promotion decision.

### Panel 2: Ontology Explorer
Show entity + relationship schema used by the runtime:
- entities: Agent, Role, Task, Claim, Receipt, Artifact, TestResult, Dependency, Lease.
- relationships: owns, claims, depends_on, proves, promotes, expires, supersedes.

### Panel 3: Context Graph View
Live graph view with filters:
- node types,
- edge types,
- verified-only toggle,
- stale/expired toggle,
- role/session scope.

### Panel 4: Coordination State (Swarm)
Operational swarm control visualization:
- queue -> claimed -> active -> verify_pending -> done/failed,
- lease owner + expiration,
- timeout/reassign events.

### Panel 5: Tool Access Matrix
Role-scoped tool rights:
- planner,
- researcher/worker,
- executor,
- verifier.

Show both allowed and blocked calls (with reason).

### Panel 6: Receipts + Artifacts
Evidence drilldown:
- receipt metadata,
- referenced artifact pointers (e.g., S3 URI),
- hash/checksum when available,
- source task/agent links.

### Panel 7: Verification Gates
Trust gates at two levels:
- local completion gate,
- shared-state promotion gate.

Display fail reasons when blocked.

### Panel 8: Freshness + Conflict Resolver
Show conflicting claims and policy resolution dimensions:
- timestamp,
- confidence,
- verifier status,
- version/lineage,
- TTL/expiration.

---

## 8) Runtime Model Requirements (Single + Swarm)

### 8.1 Single-agent loop (minimum)
- PLAN -> ACT -> VERIFY loop must be visible and replayable.
- Every ACT step produces traceable receipts.
- VERIFY outcome must alter trust status for downstream retrieval/use.

### 8.2 Swarm loop (minimum)
- plan -> assign -> execute -> verify -> merge -> replan.
- parallel writes must be observable.
- conflict and reassign behavior must be demonstrable.

### 8.3 Coordination primitives required
- Task
- Claim
- Lease
- Timeout
- Reassign
- Receipt
- VerificationResult/TestResult

---

## 9) Data Contract Expectations (Teaching-Oriented)

At minimum, records should carry fields that allow explainability:

### Task
- `task_id`, `objective`, `owner_role`, `status`, `created_at`, `updated_at`.

### Claim
- `claim_id`, `task_id`, `agent_id`, `lease_expires_at`, `status`.

### Receipt
- `receipt_id`, `task_id`, `agent_id`, `tool_name`, `input_ref`, `output_ref`, `created_at`.

### Artifact
- `artifact_id`, `uri`, `checksum`, `content_type`, `created_at`.

### Verification
- `verification_id`, `task_id`, `check_type`, `status`, `evidence_refs[]`, `verifier`, `created_at`.

### Graph node common metadata
- `node_type`, `trust_level`, `freshness/ttl`, `version`, `supersedes`.

---

## 10) Scenario Suite Required for Workshop

These are mandatory runnable scenarios:

### Scenario A: Happy Path (Single Agent)
- Create task -> produce artifact -> verify evidence -> promote.
- UI should show gate opening only after verification.

### Scenario B: No-Evidence Attempt
- Try to mark done without evidence.
- Expected: blocked promotion with explicit reason.

### Scenario C: Swarm Parallel Writes
- Two workers produce conflicting claims.
- Expected: visible conflict state + resolution policy outcome.

### Scenario D: Lease Timeout + Reassign
- Claim expires due to timeout.
- Expected: task returns to queue and reassign path appears.

### Scenario E: Stale Context Demonstration
- Introduce stale node and newer verified node.
- Expected: retrieval/view prioritizes trusted latest under policy.

---

## 11) Acceptance Criteria (Hard Gates)

1. End-to-end single-agent scenario works on fresh session.
2. End-to-end swarm scenario with at least planner + 2 workers + verifier works.
3. UI visualizes all required primitive surfaces (section 7).
4. Verification gating is enforceable and visible.
5. At least one controlled failure mode is demonstrable in under 2 minutes.
6. Guided attendee run path is executable without source edits.
7. Setup friction remains low (credentials + run path fast).

---

## 12) Prioritized Build Sequence for Implementation Agent

1. Stabilize canonical run path and scenario scripts.
2. Implement/finish UI glass-case panels with live data wiring.
3. Add explicit gate and conflict/freshness visual semantics.
4. Add workshop mutation toggles with expected outcome notes.
5. Final pass: docs alignment + facilitator quick troubleshooting map.

---

## 13) Risks and Mitigation

### Risk: UX overload
- Mitigation: default simple view + expandable details.

### Risk: noisy graph with low instructional value
- Mitigation: curated filters and scenario-scoped sessions.

### Risk: credential/setup failures consume time
- Mitigation: preflight checks, clear remediation, fast fallback path.

### Risk: swarm behavior appears nondeterministic/confusing
- Mitigation: deterministic scenario harness + timestamps + clear policy display.

### Risk: verification semantics unclear
- Mitigation: explicit “why blocked/why promoted” messaging in UI.

---

## 14) Explicit Deliverables From the Workshop Implementation Agent

The agent must deliver:

1. A concise implementation delta report:
- what changed,
- where,
- why.

2. A feature-to-file map:
- each UI panel + runtime behavior mapped to concrete files.

3. A scenario runbook:
- exact commands,
- expected observable outputs,
- troubleshooting notes.

4. A “what we still do not have” list:
- honest residual gaps,
- severity,
- workaround.

---

## 15) Response Required: Agent Must Convey Understanding to User

Before or alongside implementation, the workshop implementation agent must provide a plain-language understanding statement addressed to the user.

It must include:
1. The intended workshop outcome in 3-5 sentences.
2. What exists now vs what is missing (top 5 gaps).
3. The first implementation steps it will take.
4. How it will prove readiness.

The response should be copy-pasteable and short enough to read quickly.

---

## 16) Addendum Template (User Paste-In Section)

User instruction:
- Copy the workshop agent’s understanding response and paste it under this heading.
- This addendum will be reviewed for alignment before final implementation push.

### Addendum A: Workshop Agent Understanding (Paste Below)

```md
[Paste the workshop agent’s understanding response here]
```

### Addendum B: Review Notes (for follow-up)

```md
[Paste review feedback and requested corrections here]
```

---

## 17) One-Line Mission Reminder

Build a prebuilt, runnable, visually legible multi-agent context-engineering harness where verification and coordination are first-class and explainable.
