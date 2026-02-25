# Implementation Delta: Initializer -> Coder and Agent-Native Assembly

## Goal

Shift workshop delivery to Anthropic-style initializer -> coder, and shift architecture from deterministic final assembly to agent-native context assembly with deterministic guardrails.

## Current vs Target

Current:

- Candidate retrieval is tool-based and mostly lexical/graph traversal.
- Final assembly is primarily deterministic (`recite`, `graph_first` in `src/graph/compiler.py`).
- Verification is evidence-gated (`verify_task`) and writes graph evidence.

Target:

- Retrieval remains agent-invoked.
- Final assembly is performed by an agent-native assembly role/subagent.
- Deterministic helpers are used as constraints/checks, not as the final authority.
- Attendees implement TODOs using TDD and multi-level verification.

## Architecture Shift

### A) Assembly role

Current:

- Compiler is a deterministic packer.

Target:

- Assembly is an agent role with explicit tools and constraints.
- It emits a structured context snapshot artifact when needed for audit.
- Output is schema-validated before use.

### B) Candidate generation

Current:

- `search_nodes`, `get_node`, `neighbors`, `list_tasks`.

Target:

- Same tools + semantic retrieval source(s).
- Candidate pool is assembled by agent reasoning, not fixed deterministic ranking only.

### C) Assembly policy

Current:

- Ranking/budgeting logic is deterministic.

Target:

- Agent proposes ranked pack under budget.
- Policy checks enforce hard constraints:
  - token budget ceiling
  - required objective/plan anchors
  - allowed tools for phase
  - minimum evidence quota in VERIFY

### D) Verification feedback

Current:

- `verify_task` writes `TestResult` and links evidence.

Target:

- Same mechanism, plus compiler-agent prompt policy requires explicit use of latest verification artifacts for next assembly.

## Implementation Plan (Phased)

## Phase 1: Initializer -> coder workshop scaffold

Deliverables:

- Define attendee-facing scaffold TODOs and acceptance checks.
- Add a coder runbook section that requires:
  - one TODO at a time
  - test-first or test-with-change
  - evidence write-back after each completed TODO
- Add verification ladder to docs:
  - level 1: schema/phase/tool contract
  - level 2: deterministic runtime checks
  - level 3: objective-level behavior verification

Acceptance:

- Participants can start from scaffold and complete at least one TODO with linked evidence.

## Phase 2: Agent-native assembly interface

Deliverables:

- Add a new skill contract (example name: `assemble_context_view_agent`) that accepts:
  - `run_id`
  - `task`
  - `phase`
  - `token_budget`
  - optional retrieval hints
- Output schema includes:
  - `selected_items[]`
  - `token_estimate`
  - `selection_reason` per item
  - `policy_checks`

Acceptance:

- Output validates against schema.
- Assembly output can be consumed by workshop run without deterministic compiler call.

## Phase 3: Candidate generation expansion

Deliverables:

- Introduce semantic retrieval tool path (or adapter) in addition to lexical + graph traversal.
- Add guidance prompt for compiler-agent:
  - when to search
  - when to traverse neighbors
  - when to stop retrieving

Acceptance:

- Candidate source provenance is visible in output.
- Retrieval remains explicitly agent-invoked.

## Phase 4: Guardrail checks (deterministic policy gate)

Deliverables:

- Add deterministic post-assembly validator:
  - token budget check
  - required anchors present
  - phase/tool gating check
  - verify-evidence minimum check in VERIFY phase

Acceptance:

- Invalid packs fail fast with actionable error messages.
- Valid packs pass and are logged as artifacts/receipts.

## Phase 5: Freshness policy

Deliverables:

- Add freshness metadata fields for relevant node types.
- Add refresh strategy hooks:
  - post-task hook
  - periodic refresh job contract (every N hours)

Acceptance:

- Stale nodes are detectable.
- Assembly agent can prioritize fresher evidence when available.

## Phase 6: Workshop UX alignment

Deliverables:

- Update lab flow docs so "compile" is taught as agent-native assembly first.
- Keep deterministic compile commands as optional control experiment.
- Add side-by-side exercise:
  - agent-native assembly
  - deterministic baseline
  - compare quality, latency, and evidence usage

Acceptance:

- Participants can explain why the outputs differ.
- Participants complete single-agent then swarm using same primitive set.

## File-Level Code Rewrite Map

These are the concrete code surfaces to change after doc alignment.

1. `skills/`:
- add `assemble_context_view_agent.yml` (or chosen name)
- add/adjust schemas for verification-level outputs (`policy_checks`, `verification_level`)

2. `src/aws_tool/dispatcher.py`:
- add handler for agent-native assembly skill
- ensure output schema validation + provenance logging for assembly decisions
- include deterministic guardrail enforcement result in receipts

3. `src/graph/compiler.py`:
- keep deterministic strategies as baseline/control
- expose guardrail helpers as reusable functions (budget checks, anchors, phase rights)
- avoid treating compiler output as mandatory primary path

4. `src/tools/compile_context.py`:
- relabel as baseline/control CLI path in help text
- optionally add warning banner that workshop primary path is agent-native

5. `src/tools/smoke.py`:
- keep optional proof path
- do not require it for workshop completion criteria

6. `src/tools/doctor.py` and `src/tools/provision.py`:
- keep as required initializer infra gate
- ensure remediation text points to initializer->coder flow docs

7. `src/graph/context_graph.py`:
- add freshness metadata helpers if needed (`fresh_until`, `last_verified_at`)
- support retrieval filters for freshness/verification priorities

8. `src/summarizer/*` (optional):
- keep Bedrock optional, fallback deterministic
- ensure absence of Bedrock never blocks core loop

## Risks and mitigations

Risk: agent-native assembly becomes noisy or inconsistent.
Mitigation: strict schema + deterministic policy checks + receipt logging.

Risk: higher latency/cost from extra retrieval and agent steps.
Mitigation: retrieval stop conditions, budget caps, and phase-specific limits.

Risk: unclear debugging when assembly quality is poor.
Mitigation: persist candidate list, selected list, rejected reasons, and policy-check results as artifacts.

## Success criteria

1. Attendees complete initializer -> coder flow with TDD and verification ladder.
2. Final assembly can run without deterministic compiler as the authority.
3. Context outputs remain bounded, explainable, and evidence-aware.
4. Same lifecycle works for single agent and swarm with only coordination differences.
5. Workshop narrative and implementation are aligned (research -> primitives -> harness).
