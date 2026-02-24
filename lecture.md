# Context Engineering for Agent Swarms
*Lecture plan document (60 min)*
## Purpose of the lecture

Give attendees a coherent mental model for context engineering that scales from single-agent loops to multi-agent swarms, and tee up the workshop by defining the primitives they’ll implement (ontology, context graph, skill graph, compiler, verification loop, and harness).

## Audience assumptions

Comfortable building with coding agents (Codex / Cursor / Claude Code-class tools).

Understand tool calling at a high level.

Interested in multi-agent “swarms” but may not have a crisp framework for shared state, capability routing, and verification.

## Outcomes (what they should walk away understanding)

By the end of the lecture, attendees should be able to:

Explain context engineering as “optimizing a finite attention budget” (not just prompt writing).

Identify the five primitives that make agent systems reliable:

- Ontology
- Context graph (receipts + artifacts + evidence)
- Skill graph (tool contracts + gating)
- Context compiler (ranking + packing + compaction)
- Harness (loop + approvals + verification + garbage collection)

Map major industry patterns (Manus / OpenAI Codex harness / Claude Code / Cursor / Palantir ontology) onto those primitives.

Make good design tradeoffs for swarms: what goes in tokens vs what lives outside, and how agents coordinate via shared state.

## 1) Industry research inventory

This is the “canon” we’re pulling from, and exactly what each source contributes to the lecture.

### A. Manus: production-first context engineering heuristics

Use Manus as your “empirical, gritty” reference point:

KV-cache as a first-class metric → stable prefixes, append-only traces, deterministic serialization, explicit cache breakpoints.

“Mask, don’t remove” tools → avoid dynamically changing tool definitions mid-loop; instead gate action selection without invalidating cache or confusing the model about missing tools.

File system as context → externalized, persistent memory; compression should be restorable (keep URL/path even if you drop content).

Recitation (todo.md) → keep the plan “recent” to fight lost-in-the-middle drift.

Keep wrong turns in → errors are evidence; hiding them removes the agent’s ability to update beliefs.

### B. OpenAI: harness engineering + agent-first repositories

OpenAI gives you the “systemization” story: how to turn agents into repeatable software production.

“Give Codex a map, not a 1,000-page manual”: short AGENTS.md as a table of contents; deeper truth lives in structured docs/ as the system of record.

Agent legibility: optimize the repo (docs, architecture, quality tracking) for agent navigability.

Golden principles + garbage collection: encode mechanical taste rules and continuously clean drift/“AI slop.”

Throughput changes merge philosophy: in high-throughput agent dev, corrections are cheap; waiting is expensive.

And the “Codex harness as a real product” side:

App Server as a long-lived harness process with a bidirectional JSON-RPC protocol, streaming UI-ready events, and built-in approval pauses.

### C. Anthropic: the clean mental model + mechanisms

Anthropic provides the crisp framing + specific mechanisms.

Context engineering = curating the optimal set of tokens across system prompts, tools, MCP, external data, history, etc.

Guiding principle: “smallest set of high-signal tokens” for a desired outcome.

Avoid bloated toolsets: if a human can’t clearly choose the right tool, the agent won’t either.

Compaction guidance (especially clearing tool outputs) + structured note-taking outside context.

Long-running harness patterns: initializer agent + incremental coding agent, “feature list” scaffolding, progress files, and forcing end-to-end testing.

Advanced tool use: tool search, programmatic tool calling, standardized tool-use examples → reduce context load and scale tool libraries.

### D. Claude Code: the agent loop and practical context controls

Claude Code is a great “concrete loop” anchor:

The agentic loop: gather context → take action → verify, repeating.

Automatic compaction: clear old tool outputs first, then summarize; keep durable rules in CLAUDE.md.

Skills load on demand; subagents isolate context; plan mode and permissions gate actions.

### E. Cursor: harness anatomy + plan-first + rules vs skills

Cursor gives you a clean decomposition and strong UX best practices.

Harness = instructions + tools + user messages.

Plan mode: do research + create plan + wait for approval; store plans as artifacts to resume later.

Customization split:

Rules = always-on project context

Skills = dynamic workflows/knowledge loaded when relevant (keeps context clean)

### F. Palantir Ontology: semantics + kinetics (actions) as the missing layer

Use Palantir as your “ontology as product infrastructure” reference:

Ontology defines semantics via object types + link types (relationships).

Ontology also defines “kinetics” via action types (transactional edits + validation + side effects) and functions.

This maps beautifully onto “skills as actions” and “context graph as typed objects/links.”

## 2) The lecture’s core thesis (your “one slide”)

Context engineering is systems engineering for attention.
You aren’t just writing prompts—you’re designing:

what gets written down,

what gets remembered,

what gets verified,

what tools are available when,

and how agents recover and coordinate across time.

## 3) Glossary (make the room speak the same language)
### Context (operational definition)

The tokens you actually send to the model each turn; a finite resource you must optimize for the task.

### Harness

The execution environment + protocols + tools + safety/approval/verification mechanisms that turn a model into an agent (or swarm member).

### Ontology

A shared schema of “what exists” and “how it relates” (objects + links), plus governed actions that change it (action types).

### Context graph

A typed, queryable representation of runtime truth:

receipts (what happened),

artifacts (outputs/logs/files),

evidence (tests/results/observations),

decisions (why we did it).
(We’ll cite Manus’s “keep wrong stuff in” as a motivation: errors are evidence.)

### Skill graph

The catalog of capabilities with contracts (schemas), preconditions, and phase gating. “Tools, but disciplined.”

### Context compiler

The component that selects and packs the best subset of context for the next turn: ranking, budgeting, compaction, recitation.

## 4) Lecture narrative arc (how it flows)

You want a story that feels inevitable:

Why swarms fail: token bloat, tool bloat, drift, and “lost-in-the-middle.”

The harness view: every major agent product converges on a loop + tools + gating.

Introduce the primitives (ontology, context graph, skill graph, compiler, verification loop).

Case studies show each primitive “in the wild” (Manus/OpenAI/Claude/Cursor/Palantir).

Workshop bridge: we implement the primitives on AWS and let attendees compose strategies.

## 5) Minute-by-minute plan (60 minutes)
### 0:00–0:05 — Cold open: “Context is the new bottleneck”

Goal: shift their mindset from “prompting” to “state management.”

Context engineering is the progression from prompt engineering: the question becomes “what configuration of context yields desired behavior?”

Point out the common trap: agents generate too much potentially relevant data, then drown.

### Audience anchor question:
“If you had to choose: better model or better context—what wins this year?”

### 0:05–0:15 — Anatomy of an agent harness (single agent first)

Goal: define the loop and the harness boundaries.

Claude Code loop: gather → act → verify.

Cursor harness components: instructions, tools, user messages.

OpenAI harness/App Server: long-lived process, event stream, approvals that pause turns.

### Key idea:
The harness is where context engineering “lives,” because it decides what gets injected and what gets executed.

### 0:15–0:30 — The primitives (the framework you’ll reuse all night)

Goal: introduce your canonical 5 primitives and show why each exists.

Ontology (shared semantics)

Palantir: object/link types define meaning; action types define governed change.

Lecture tie-in: “If your swarm can’t agree on what a ‘Task’, ‘Receipt’, or ‘TestResult’ is, you don’t have a swarm—you have a group chat.”

Context graph (runtime truth)

Manus: use file system as persistent context; compression must be restorable.

OpenAI: treat repo knowledge as system of record; keep plans as first-class artifacts.

Anthropic/Claude Code: clear tool outputs and summarize when context fills; don’t rely on raw history.

Skill graph (capabilities with contracts)

Anthropic: bloated tool sets cause ambiguity and failures.

Manus: “mask, don’t remove” tools to avoid destabilizing tool definitions mid-loop.

Cursor: rules vs skills; skills are dynamic and keep context clean.

Anthropic advanced tool use: tool search + programmatic tool calling as ways to scale tools without blowing context.

Context compiler (selection + packing)

Anthropic: smallest set of high-signal tokens is the guiding principle.

Manus: recitation pushes the plan back into recent attention.

Claude Code: clears tool outputs first, then summarizes.

Verification loop (evidence changes behavior)

Manus: keep errors in context; they’re evidence for adaptation.

Claude Code: verify results is a named phase of the loop; permissions/checkpoints emphasize safe execution.

Anthropic long-running harness: incremental progress + explicit testing tools prevent “declares done” failure modes.

### 0:30–0:45 — Case studies: “Here’s how the pros do it”

Goal: make this feel real, not theoretical.

#### Case study 1: Manus (context engineering beats model training)

KV-cache-first design and why stable prefixes matter in long loops.

Tool gating via masking (why dynamic tool defs often hurt).

Filesystem memory + restorable compression.

Todo recitation and “keep wrong stuff in.”

#### Case study 2: OpenAI Codex harness engineering (agent-first production)

AGENTS.md as map; docs as system of record; plans as artifacts.

Golden principles + garbage collection to fight drift.

App Server architecture: stable protocol surface, event streams, approvals (human-in-loop as a first-class RPC).

#### Case study 3: Cursor + Claude Code (productized harness patterns)

Plan-first and approval gating is a usability feature and a context engineering feature.

Rules vs skills vs subagents for controlling what loads into context.

#### Case study 4: Palantir Ontology (schema + actions = scalable coordination)

Use ontology to prevent “semantic drift” across agents and across time.

Treat skills as action types with validation + side effects, not ad-hoc scripts.

### 0:45–0:55 — Swarms: what changes vs single agents?

Goal: give them swarm-specific intuition.



### Key changes when you go from 1 agent → N agents:

Shared state becomes a product

If a swarm has no shared system-of-record, it spends all its budget re-deriving context or arguing with itself. (This is the repo/docs “system of record” idea generalized.)

Capability routing becomes mandatory

Tool bloat + ambiguous choice points blow up with more agents.

Skills must be typed, discoverable, and gated (phase/state-based), otherwise you get “armed but dumber.”

Verification is how swarms converge

Without evidence, swarms just produce more text. With evidence, they update a shared graph and stop re-litigating.

Garbage collection matters more than brilliance

Drift compounds faster with more parallelism; continuous cleanup prevents “pattern replication” from degrading the system.

### Quick audience exercise (2 minutes):
You give them 3 candidate “things” and ask:

“Tokens now?”

“External memory?”

“Artifact store?”
Then reveal how Manus/Claude Code/OpenAI would treat them.

### 0:55–1:00 — Bridge to workshop: what they’ll build tonight

Goal: make the workshop feel like the natural continuation.



In the workshop, we’ll implement the primitives as an actual system:

Ontology: the schema for nodes/edges/constraints (Palantir-inspired).

Context graph: durable runtime truth store (think “system of record”).

Skill graph: typed skills with phase gating (masking/gating mindset; rules vs skills mindset).

Context compiler: RECITE vs GRAPH_FIRST strategies; compaction optional.

PLAN→ACT→VERIFY loop: evidence changes the next compiled context pack.

(And because AWS is sponsoring workshop accounts, we can treat AWS resources as “the substrate” for persistence and artifacts—without attendees needing to build infra from scratch.)

## 6) What the lecture demo should prove (one clean “aha”)
### Demo goal

Show that verification evidence changes what the agent sees next—without rewriting the whole prompt.



### Demo script idea (works live or pre-recorded):

Show context pack v1 (contains objective, plan, recent receipts).

Run an action that fails (or intentionally produces a warning).

Run a verifier that writes a TestResult/Finding node + marks something validated/unvalidated.

Show context pack v2: evidence is promoted; irrelevant tool logs are demoted/cleared/summarized.

### This ties directly to:

Manus “keep wrong stuff in” (errors become evidence).

Anthropic’s compaction/tool-result clearing guidance.

Claude Code’s explicit verify phase.

## 7) “Sparring questions” for you to build mastery

Use these to test whether the framework is internalized.

### Conceptual

If context is a finite resource, what do you refuse to put in it? Why?

In a swarm, what shared state must be globally consistent vs locally cached? (And why?)

What’s the failure mode of “one big rules file,” and what’s the map-based alternative?

### Mechanical

Why does dynamically adding/removing tools mid-loop often make performance worse?

What’s the difference between rules and skills as context control knobs?

If you can only keep 5 “things” from a 50-step agent trace, what are they? (And how do you ensure the rest is restorable?)

### Design tradeoffs

When is recitation better than retrieval? When is retrieval better than recitation?

How would you encode “golden principles” in a way that agents can’t easily drift from?

If you had to remove one primitive (ontology / graph / skills / compiler / verification), which removal hurts most—and why?

## 8) Next step (so we move forward immediately)

If you like this structure, the next thing I’ll do in-chat is write a full lecture script (not slides) in the format:

section title

what you say (speaker voice)

“on screen” notes (what the audience sees)

callouts to the workshop checkpoint it enables

Then, once you share your preferred Gemini slide style, I’ll convert that script into Gemini prompts that generate the deck in your style (and keep the deck strictly aligned to the workshop).
