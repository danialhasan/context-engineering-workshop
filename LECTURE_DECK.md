# Context Engineering Lecture Deck (Plain Markdown)
30-minute lecture aligned to the hands-on workshop implementation.

## Slide 01: Cover
# Context Engineering for Agent Swarms
## From Demo Agents to Reliable Systems

- Focus: context systems for reliable agents
- Runtime in workshop: DynamoDB + S3 (+ optional Bedrock)
- Goal: from "cool demo" to "reliable execution"

<!--
Speaker notes:
- Promise: this is the practical operating model behind modern coding agents.
- Position AWS as infrastructure, not the core idea.
-->

---

## Outcomes For This Session

By the end of 30 minutes, attendees should be able to:

1. Explain what an agent is: a harnessed control loop around a model.
2. Describe why most failures are context failures, not model failures.
3. Summarize three research approaches (Anthropic, OpenAI, Manus) and what each contributes.
4. Use five primitives to design reliable single-agent and swarm workflows.
5. Explain the "compiler" as a composable context assembly pipeline.

<!--
Speaker notes:
- Keep this as a contract for the next 30 minutes.
- No implementation deep dive yet; save command-level detail for lab.
-->

---

## Flow (Sequential)

1. Why this matters (agent + harness basics).
2. Research: three approaches to context engineering.
3. Memory pipeline: store broadly, compile narrowly.
4. Compiler: candidate generation vs agent-native assembly + deterministic guardrails.
5. Verification: "no promotion without evidence."
6. Single agent -> swarm: coordination pressure and typed handoffs.
7. Workshop bridge: what we build and why AWS is here.

<!--
Speaker notes:
- This keeps us sequential without over-indexing on exact minute marks.
-->

---

## Gemini Prompt Pack: Slides 02-05

Use this style block on each prompt:

```text
Create a 16:9 slide in an arXiv-paper figure style. White background, black text, thin vector lines, muted pastel fills, concise labels, and panel-style composition. Keep diagrams simple and readable from a distance, but avoid cinematic gradients/glass effects. Prefer publication-like clarity over decoration.
```

Slide 02 prompt ("What is an agent"):

```text
Create Slide 02 titled "What Is An Agent?". Include one large sentence: "An agent is a stateful control loop around a stateless reasoning model." Add a simple loop diagram with 5 nodes in one row or circle: Observe, Reason, Act, Verify, Repeat. Include a short footer line: "Model does inference. Harness runs the loop."
```

Slide 03 prompt ("Model vs Harness"):

```text
Create Slide 03 titled "Model != Agent". Use a 2-column layout with large labels. Left column: "Model" and bullets "stateless inference", "token-level reasoning". Right column: "Harness" and bullets "tools", "memory", "context management", "verification". Add a bottom line: "You interact with the harness, not the raw model."
```

Slide 04 prompt ("Failure thesis"):

```text
Create Slide 04 titled "Most Agent Failures Are Context Failures". Show three large failure cards side by side: "Unclear State", "Ambiguous Tools", "No Verification Loop". Add one closing line below the cards: "When context control collapses, output quality collapses."
```

Slide 05 prompt ("Failure mode diagrams"):

```text
Create Slide 05 titled "Failure Modes (Simple Visuals)". Use three left-to-right mini diagrams with thick arrows and very few nodes.
Diagram 1 label: "State Drift" with flow "Task -> Wrong Assumption -> Bad Output".
Diagram 2 label: "Tool Ambiguity" with flow "Task -> Tool A or B? -> Inconsistent Output".
Diagram 3 label: "No Verification" with flow "Claim Done -> No Evidence -> Bad State Promoted".
Keep each diagram readable from far away. No small annotations.
```

Reference assets already generated:

- `docs/lecture/assets/failure-modes/arxiv-style/state-drift-arxiv.jpg`
- `docs/lecture/assets/failure-modes/arxiv-style/tool-ambiguity-arxiv.jpg`
- `docs/lecture/assets/failure-modes/arxiv-style/no-verification-arxiv.jpg`

Research section prompt pack:

- `docs/lecture/gemini-prompt-pack-research.md`

---

## Start Here: What Is An Agent?

- A model is stateless inference.
- An agent is a stateful control loop around that model.
- A harness provides:
  - tool execution
  - memory/state management
  - context assembly
  - verification and stop conditions
- This lecture focuses on the memory/context part of the harness.

<!--
Speaker notes:
- Simple framing line: "You do not talk to the model directly; you talk to a system around it."
-->

---

## Why Agents Fail In Practice

- Context drift: stale, noisy, or missing state.
- Tool ambiguity: too many tools or weak contracts.
- No verification loop: "done" claims without evidence.
- Token overload: everything is "important," so nothing gets attention.

<!--
Speaker notes:
- Say this explicitly: many "model failures" are harness/context failures.
-->

---

## Research: Three Approaches (Big Picture)

- **Anthropic**: context budget is finite; prioritize the smallest high-signal set.
- **OpenAI**: harness engineering; make the environment legible and enforce invariants.
- **Manus**: production heuristics for long-running loops; keep plans recent and traces intact.

<!--
Speaker notes:
- This slide is theory alignment before architecture details.
-->

---

## Anthropic Approach: Budget And Signal

- Constraint: the model only "sees" a limited token window each turn.
- Goal: smallest set of high-signal tokens for the next action.
- Practical moves:
  - keep tools unambiguous
  - externalize durable memory
  - summarize/compact aggressively
  - verify with concrete checks (tests, read-backs, assertions)

<!--
Speaker notes:
- This is the attention-budget framing. It motivates a compiler.
-->

---

## OpenAI Approach: Harness Engineering

- Treat the harness as the product: feedback loops, legibility, invariants.
- Make the system easy for agents to navigate:
  - map docs (`AGENTS.md`) -> system of record (`docs/`)
  - stable interfaces and conventions
  - enforce architecture mechanically (linters/tests/structure)
- Build for iteration:
  - instrument
  - verify
  - repair quickly

<!--
Speaker notes:
- This is "environment design" as leverage.
-->

---

## Manus Approach: Long-Loop Heuristics

- Keep plans recent (recitation) to fight "lost in the middle."
- Keep errors in the trace: failures are evidence for recovery.
- Keep the tool surface stable; gate capability rather than reshaping tools each step.
- Externalize memory (filesystem/artifacts) and keep pointers for rehydration.

<!--
Speaker notes:
- Manus is the gritty operator playbook.
-->

---

## Memory Pipeline (Shared Across Approaches)

1. Ingest events/artifacts from work.
2. Normalize into typed units (ontology).
3. Store in durable external memory (graph + artifacts).
4. Retrieve candidates (agent-invoked).
5. Expand via relationships (graph traversal).
6. Assemble a minimal execution context (compiler).
7. Verify outcomes and write back evidence.

Key principle: store broadly, compile narrowly.

<!--
Speaker notes:
- This slide sets up the compiler scope debate cleanly.
-->

---

## The Five Primitives (Reusable Architecture)

1. **Ontology**: shared meaning (Task, Receipt, Artifact, TestResult).
2. **Context graph**: persistent runtime truth.
3. **Skill graph**: controlled capabilities and contracts.
4. **Context compiler**: budgeted context assembly.
5. **Verification loop**: no promotion without evidence.

<!--
Speaker notes:
- Stress that these work for one agent and for swarms.
-->

---

## Compiler: Candidate Generation vs Assembly

- Real systems are not a single function:
  - candidate generation (agentic search + semantic retrieval + graph traversal)
  - agent-native assembly under explicit constraints
- We teach "compiler" as the assembly process:
  - agent decides what to retrieve and include next
  - deterministic guardrails enforce budgets/contracts
  - emits an auditable context snapshot artifact when needed

<!--
Speaker notes:
- The agent chooses when to retrieve and assemble.
- Guardrails decide what is allowed to ship into the next turn.
-->

---

## Compiler: Composable Pipeline (Opinionated)

1. Deterministic seed pack (objective/plan/constraints/allowed tools).
2. Agent-invoked retrieval (search nodes, fetch artifacts, query graph).
3. Graph expansion (neighbors along typed edges).
4. Agent-native rank + budget + pack.
5. Deterministic guardrails validate contracts/budgets/phase rights.
6. Verification writes evidence back; next assembly prioritizes validated items.

<!--
Speaker notes:
- "Control plane vs exploration plane": agentic discovery + agentic assembly, deterministic guardrails.
-->

---

## Verification: "No Promotion Without Evidence"

- Verification is not "evaluate the model." It governs shared truth.
- A claim becomes durable state only when linked to evidence:
  - S3 write -> `s3://...` + optional head/read-back
  - DDB write -> read-back / invariant check
  - "bug fixed" -> tests/build/repro evidence
- Promotion rule:
  - unverified stays unvalidated (low priority, not "truth")
  - verified becomes validated (high priority, safe to reuse)

<!--
Speaker notes:
- In swarms, this prevents one agent from poisoning shared memory for all.
-->

<!--
- This slide should feel like an operational safety rule, not philosophy.
-->

---

## From Single Agent To Swarms

Swarms are the same theory under higher coordination pressure:
- Typed handoffs become mandatory (ontology).
- Shared durable state becomes mandatory (context graph).
- Role-specific tool rights matter more (skill graph).
- Per-agent local context curation is mandatory (compiler).
- Cross-agent claims still need evidence (verification).

<!--
Speaker notes:
- "More agents" magnifies context mistakes unless architecture is explicit.
-->

---

## Workshop Bridge: How AWS Fits

- AWS is infrastructure for the primitives:
  - DynamoDB (`GraphNodes`, `GraphEdges`) for structured state.
  - S3 for larger artifacts and logs.
  - Optional Bedrock for compaction helpers.
- The workshop does not teach "AWS for AWS's sake."
- It applies context engineering concepts in a real runtime.
- Workshop delivery pattern is initializer -> coder:
  - initializer provides scaffold and constraints
  - coder uses agent-native retrieval/assembly + TDD + verification

<!--
Speaker notes:
- Keep command details for the lab.
- Lecture objective is conceptual transfer, then practical application.
-->

---

## What Attendees Leave With

- A reusable architecture for reliable agents in their own stack.
- A framework to evaluate any memory system or vendor claim.
- A practical way to move from single-agent demos to coordinated swarms.
- A workshop implementation they can show their team as a reference pattern.

<!--
Speaker notes:
- Final line: "Tomorrow at work, you can explain this as a system design pattern, not a prompt trick."
-->
