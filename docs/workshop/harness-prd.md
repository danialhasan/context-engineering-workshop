# Workshop Harness PRD (Draft)

Status: Draft v0.1  
Owner: Danial + Codex  
Last updated: 2026-02-25

## 1) Product Summary
Design and deliver a research-aligned workshop where attendees build a minimal agent harness on AWS infrastructure and implement context-engineering primitives directly, instead of only running prebuilt smoke scripts.

This workshop should teach attendees how to apply research insights (Anthropic, OpenAI, Manus) to practical harness design for single agents and small swarms.

## 2) Problem Statement
The current workshop flow can feel implementation-heavy (`doctor/smoke/compile`) and does not fully convey the core research lessons from the lecture.

We need a hands-on experience where attendees build a small, understandable system that demonstrates:
- finite context budget management,
- explicit memory/state structure,
- tool/capability control,
- evidence-gated completion.

## 3) Goals
1. Make research concepts tangible via a small harness attendees can reason about.
2. Keep implementation compact (primitives-first, low line count).
3. Use AWS services as infrastructure, not as the main teaching objective.
4. Preserve reliability and workshop operability for a live event.
5. Ensure attendees leave with a portable pattern they can apply at work.

## 4) Non-Goals
1. Building a production-grade full application end-to-end.
2. Adding new AWS services beyond current scope.
3. Teaching deep AWS platform internals.
4. Expanding architecture complexity beyond the core primitives.

## 5) Target Audience
- Engineers already using coding agents (Claude Code, Cursor, Codex, Kiro, in-house tools).
- Mixed backgrounds; limited time; need conceptual clarity + practical applicability.

## 6) Core Thesis To Implement
Context engineering is systems engineering for attention.

Attendees should build and observe a harness that applies five primitives:
1. Ontology (shared meaning)
2. Context graph (durable state/evidence)
3. Skill graph (controlled capabilities)
4. Context compiler (budgeted high-signal selection)
5. Verification loop (no done without evidence)

## 7) Proposed Workshop Experience (High Level)
1. **Infra gate (fast):** run environment checks only to confirm account readiness.
2. **Build harness (main):** implement minimal loop and primitives in guided steps.
3. **Compare behaviors:** baseline vs improved harness behavior on same task.
4. **Scale pressure:** adapt from single-agent loop to small role-based swarm.
5. **Debrief:** map observed behavior back to research findings.

## 8) Scope of Build (Minimal Harness)
Attendees produce a compact harness (starter template + TODOs preferred) containing:

1. `ontology/types`
- Minimal typed entities: Task, Receipt, Artifact, VerificationResult, Failure.

2. `state + artifacts`
- DynamoDB for graph-like state records (nodes/edges or equivalent typed records).
- S3 for artifact payloads/logs.

3. `skill execution boundary`
- Allowlisted skills/tools with clear contracts.
- Role/phase gating (PLAN / ACT / VERIFY).

4. `context compiler`
- Agent-native context assembly under token/time constraints, with deterministic guardrail checks.

5. `verification gate`
- Task completion requires evidence-backed verification output.

## 8.1) Lifecycle (What We Implement End-to-End)
This is the shared "control loop" that will be implemented first for a single agent, then extended to a small swarm.

### Core objects (minimum set)
- **Objective**: what we are trying to achieve (human-visible).
- **Plan**: the current steps (recited and kept recent).
- **Task**: an assignable unit of work (the coordination currency).
- **Claim**: a worker's claim/ownership of a task (typed handoff).
- **Receipt**: "what happened" record, emitted for each action/tool call.
- **Artifact**: immutable payload pointer (S3 URI + checksum) for larger outputs/logs.
- **TestResult**: a verification result that references receipts/artifacts.

### Single-agent lifecycle (PLAN -> ACT -> VERIFY)
1. **Initialize session**
- create `Session` (or session_id) and write an `Objective`.

2. **PLAN**
- write/update `Plan` with explicit steps
- optionally create `Task` nodes if decomposing work
- compile a seed context pack (objective, plan, constraints, allowed tools)

3. **ACT**
- execute an allowlisted skill/tool
- emit: `SkillCall` -> `Receipt` (+ optional `Artifact` with logs/output)

4. **VERIFY**
- run deterministic checks (read-back, head-object, assertions)
- emit: `TestResult` linking to evidence
- promotion rule: only verified items are marked/treated as validated truth

5. **Repeat until done**
- compiler prioritizes validated evidence in the next pack

### Swarm lifecycle (Planner / Workers / Verifier)
The core loop is identical, but coordination pressure is handled by `Task` + `Claim` + evidence-gated promotion.

1. **Planner**
- writes `Objective` and `Plan`
- creates multiple `Task` nodes (typed, small, testable)

2. **Workers**
- each worker `Claim`s a `Task`
- executes only its allowlisted capability set
- emits receipts/artifacts for actions

3. **Verifier**
- verifies task outputs against receipts/artifacts
- emits `TestResult`
- only then marks the task "done" (promotion)

4. **Coordinator view**
- one assembly role/subagent assembles role-local context per step:
  - planner: objective + plan + task status summaries
  - worker: claimed task + relevant evidence + allowed tools
  - verifier: claims + receipts + artifacts + checks

## 8.2) Compiler Policy (Opinionated)
- Retrieval is **agent-invoked**, not always-on.
- Candidate generation is agentic (search/traversal/semantic retrieval where available).
- Final assembly is agent-native, with deterministic guardrails:
  - enforce token/time budget ceilings
  - enforce phase/tool rights
  - require objective/plan anchors
  - prioritize verified evidence
- Verification governs promotion: "no promotion without evidence."

## 9) What Changes vs Current Flow
Current:
- `make doctor` -> `make smoke` -> `make compile`

Proposed emphasis:
- `make doctor` stays (infra readiness gate)
- `make smoke` becomes optional fallback/demo artifact, not core pedagogy
- Core lab shifts to initializer -> coder implementation over harness primitives

## 10) Success Criteria
### Learning outcomes
1. Attendees can explain each primitive and where it appears in code.
2. Attendees can explain why compiler + verification improve reliability.
3. Attendees can describe how to scale same model to multi-agent coordination.

### Functional outcomes
1. Harness executes a task loop with evidence capture.
2. Context pack changes when verification evidence is added.
3. Completion is blocked without required verification evidence.
4. Same architecture can be adapted to 3-role swarm (planner/worker/verifier).

## 11) Constraints
1. Total workshop runtime: a few hours.
2. Attendee setup friction must remain low.
3. Code footprint should stay small and teachable.
4. Bedrock remains optional and non-blocking.
5. Must work with provisioned sandbox account model.

## 12) Risks and Mitigations
1. **Risk:** Build-from-scratch is too slow.  
   **Mitigation:** starter template with clearly bounded TODO blocks.

2. **Risk:** Attendees get stuck on AWS setup.  
   **Mitigation:** fast readiness gate + fallback environment guidance (Kiro/RDP).

3. **Risk:** Too much time spent on code mechanics, not concepts.  
   **Mitigation:** each coding block tied to one primitive + one research takeaway.

4. **Risk:** Swarm section becomes too complex.  
   **Mitigation:** fixed 3-role swarm only; no dynamic orchestration complexity.

## 13) Deliverables
1. Updated facilitator flow and participant lab guide.
2. Minimal harness starter implementation (small code footprint).
3. Explicit rubric/checkpoints for pass/fail during workshop.
4. Post-workshop “take-back” artifact for attendees to share with teams.

## 14) Expanded Decision Block (Interview Queue)
Status legend: `[ ] open` `[x] decided`

Purpose: these decisions define the opinionated harness shape.  
Instruction: choose one option per decision unless marked "multi-select."

### A) Learning and Workshop Shape
1. `[ ]` **D1 Build mode**
- Why it matters: controls learning depth vs speed.
- Options:
  - `A` Live build from scratch
  - `B` Starter template + TODOs
  - `C` Mostly prebuilt walkthrough
- Current recommendation: `B`

2. `[ ]` **D2 Lab interface**
- Why it matters: controls setup friction and debug ergonomics.
- Options:
  - `A` CLI-first
  - `B` Notebook-assisted
  - `C` Hybrid (CLI + notebook checkpoints)
- Current recommendation: `C`

3. `[ ]` **D3 Session composition**
- Why it matters: balances coding vs conceptual transfer.
- Options:
  - `A` Code-heavy
  - `B` Balanced (build + discuss)
  - `C` Discussion-heavy with guided code
- Current recommendation: `B`

4. `[ ]` **D4 Dataset/task**
- Why it matters: controls comparability across attendee outputs.
- Options:
  - `A` Fixed canonical scenario for all
  - `B` Attendee-chosen scenario
  - `C` Canonical baseline + attendee extension
- Current recommendation: `C`

### B) Harness Architecture Decisions
5. `[ ]` **D5 Runtime pattern**
- Why it matters: determines control-loop clarity.
- Options:
  - `A` Single loop only
  - `B` Single loop then role split (planner/worker/verifier)
  - `C` Role split from start
- Current recommendation: `B`

6. `[ ]` **D6 Ontology strictness**
- Why it matters: impacts correctness vs agility.
- Options:
  - `A` Minimal types only (Task, Receipt, Artifact, VerificationResult, Failure)
  - `B` Minimal + strict required fields/relations
  - `C` Rich ontology from full workshop spec
- Current recommendation: `B`

7. `[ ]` **D7 Context graph representation**
- Why it matters: influences explainability and complexity.
- Options:
  - `A` Flat typed records
  - `B` Nodes + typed edges (graph-native)
  - `C` Flat records with derived links
- Current recommendation: `B`

8. `[ ]` **D8 Skill model and execution boundary**
- Why it matters: controls safety and reproducibility.
- Options:
  - `A` Free-form tool calls
  - `B` Allowlisted skills with schema validation
  - `C` Allowlisted + role/phase gating
- Current recommendation: `C`

9. `[ ]` **D9 Context compiler policy**
- Why it matters: determines context quality and determinism.
- Options:
  - `A` Retrieval-only
  - `B` Agent-native assembly + deterministic guardrails
  - `C` `B` + optional model-assisted compaction helpers
- Current recommendation: `C` (compaction helpers optional; guardrails always on)

10. `[ ]` **D10 Verification policy**
- Why it matters: defines reliability bar.
- Options:
  - `A` Soft verification (warn-only)
  - `B` Hard gate (`no evidence -> no done`)
  - `C` Hard gate + contradiction checks
- Current recommendation: `B`

### C) AWS and Operational Decisions
11. `[ ]` **D11 AWS abstraction level**
- Why it matters: affects pedagogy and portability.
- Options:
  - `A` Raw boto3 in attendee-facing code
  - `B` Thin helper wrappers for DynamoDB/S3
  - `C` Wrapper CLI only
- Current recommendation: `B`

12. `[ ]` **D12 Infra gate role (`doctor/smoke`)**
- Why it matters: preserves readiness while shifting pedagogy.
- Options:
  - `A` Keep both as required path
  - `B` `doctor` required, `smoke` optional proof artifact
  - `C` Both optional
- Current recommendation: `B`

13. `[ ]` **D13 Region/account standardization**
- Why it matters: controls cross-attendee failure rate.
- Options:
  - `A` Fixed single region for lab
  - `B` Region-flex with facilitator support
  - `C` Attendee choice
- Current recommendation: `A`

14. `[ ]` **D14 Multi-tenant/session scoping**
- Why it matters: prevents collisions and cross-session bleed.
- Options:
  - `A` Single shared namespace
  - `B` Per-attendee namespace (recommended)
  - `C` Per-team namespace
- Current recommendation: `B`

### D) Swarm and Evaluation Decisions
15. `[ ]` **D15 Swarm depth**
- Why it matters: controls complexity during limited time.
- Options:
  - `A` Single handoff only
  - `B` Full planner-worker-verifier pass
  - `C` Add evaluator/reflection agent
- Current recommendation: `B`

16. `[ ]` **D16 Failure-mode drills (multi-select)**
- Why it matters: ties lab directly to research claims.
- Options:
  - `A` Missing evidence blocks completion
  - `B` Ambiguous tool call blocked by contract
  - `C` Context budget overflow causes degraded output
  - `D` Contradictory updates require verification resolution
- Current recommendation: `A + B + D`

17. `[ ]` **D17 Scoring rubric**
- Why it matters: ensures clear completion and debrief quality.
- Options:
  - `A` Binary pass/fail only
  - `B` Primitive-by-primitive checklist
  - `C` Checklist + qualitative architecture justification
- Current recommendation: `C`

18. `[ ]` **D18 Attendee take-back artifact**
- Why it matters: determines post-workshop adoption potential.
- Options:
  - `A` One runnable harness file
  - `B` Harness module + architecture diagram + checklist
  - `C` Slides + notes only
- Current recommendation: `B`

### E) Delivery and Follow-Through Decisions
19. `[ ]` **D19 Documentation packaging**
- Why it matters: affects replayability after event.
- Options:
  - `A` Single lab doc
  - `B` Participant + facilitator split docs
  - `C` Split docs + one-page executive recap
- Current recommendation: `C`

20. `[ ]` **D20 Final workshop storyline**
- Why it matters: keeps lecture-lab continuity.
- Options:
  - `A` "Build from primitives"
  - `B` "Fail -> fix with primitives"
  - `C` "Single agent -> swarm"
- Current recommendation: `B + C` combined

## 15) Decision Log
1. `2026-02-25` Lecture emphasis shifted to research + memory systems core.
2. `2026-02-25` Workshop direction shifted from script-running to primitive-building.
3. `2026-02-25` AWS positioned as infrastructure substrate, not pedagogical center.

## 16) Next Iteration Plan
In the next conversation round, we will fill:
1. exact attendee build path (step-by-step),
2. required files to add/change,
3. scoring rubric/checkpoints,
4. facilitator script for live execution.
