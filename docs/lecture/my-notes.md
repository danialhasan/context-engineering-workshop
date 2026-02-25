# My Notes (Draft)

This file is a working scratchpad for the lecture/workshop narrative. It intentionally mixes raw notes and draft prose.

## Lecture Notes (Timeboxed Draft)

0:00-2:00 | Why this matters

"Most agent failures are not model failures. They are context failures.
If an agent has unclear state, unclear tools, or no verification loop, quality collapses."

We should start by explaining what an agent even is. And why we use agents, and how they're made.

An agent can be defined as a stateful control loop that repeatedly invokes a stateless reasoning model, interprets its outputs, executes tools and memory options, and feeds the results back until a termination condition is met.

Example: ChatGPT is a harness around the GPT models. You can select multiple models, but when you send it some data you're not talking directly to the model; you're talking to an abstraction over it that augments the model's capabilities. This can be seen from the ability to upload files, attach MCP servers, etc.

So basically, you have a model, and then you have everything that surrounds the model, which is known as the harness. Effective harnesses can turn good models into super powerful agents.

Modern harnesses are composed of many systems that enable tool execution, memory, and context management. This lecture and workshop will focus on the context management, because context is king in the world of AI.

Context engineering can be defined as the act of implementing a system that feeds the most relevant context to a reasoning model for a given task.

Core idea: context engineering is attention systems engineering.
Mainly because a major foundational mechanic of these AI systems are the underlying attention mechanisms, which reside in the model layer. We're not going to get into that because its a lot of math, but basically these models pay different amounts of attention to different tokens they're given.

2:00-5:00 | What this is not

"This is not replacing Claude Code/Cursor/Kiro.
This is the operating system around them so outputs are reliable and scalable."

Single agent can look good in demos.
Real work breaks when context drifts, tools are ambiguous, and completion is unverified.

5:00-12:00 | The five primitives

1. Ontology
   "Shared meaning."
   What is a task, receipt, artifact, verification result, failure?
2. Context graph
   "Shared memory."
   Persistent evidence outside the token window. Not just chat history.
3. Skill graph
   "Controlled capability."
   Clear tool contracts, preconditions, and phase gating.
4. Context compiler
   "Attention budget manager."
   At each step, inject the smallest high-signal context, not everything.
5. Verification loop
   "Trust mechanism."
   No "done" without evidence. Errors are data, not noise.

Note: for the verification loop, frame it in the lens of ML optimization problems, because long running autonomous agent tasks are best framed as ML optimization problems with the same constraints.

Open question: I don't understand the compiler. Why do we call it a compiler? I haven't reviewed any of the code in this repo nor run it.

Workshop question: what do attendees actually do? We can't have them just download and run scripts. We also probably can't have them generate a full product (bugs, time). One idea is injecting their own context (for example: provider export of conversations) to seed the system.

12:00-16:00 | From single agent to swarms

"Swarms are not a different theory. Same primitives, higher coordination pressure."

What changes:
- Handoffs must be typed (ontology).
- Shared state must persist (context graph).
- Tool rights/capabilities must be role-specific (skill graph).
- Each agent needs curated local context (compiler).
- Cross-agent claims still require evidence (verification loop).

Sanity check against primary sources (re-read):

- Manus: https://manus.im/blog/Context-Engineering-for-AI-Agents-Lessons-from-Building-Manus
- OpenAI: https://openai.com/index/harness-engineering/
- Anthropic: https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents

## Harness Baseline: Hydration + Levers (Single Agent)

Every agent starts off with no context. Then its harness deterministically injects context on boot. This context hydration is always:

- system prompt
- agents.md (or claude.md for Claude Code)

Some minimal harnesses have a short system prompt and maybe only inject agents.md if extended to do so. Other more opinionated harnesses like Claude Code auto-inject claude.md.

That's it. Everything else in terms of engineering the context to give to the model is based on:

1. the model being instructed to search for the right context
2. the model being able to access the right context, efficiently

So this is two parts.

The first part is instruction. The lever for that is system prompt + agents.md. Skills are also relevant here because they're behavior contracts. Essentially, (1)'s only lever is behavior contracts fed to the model.

(2) is beyond instruction. This describes the systems outside of the model + agent, and the interfaces between those systems and the agent. So, the context graphs, file systems, databases, pipelines, etc. All of these are systems that are used to CRUD context and structure it efficiently. The interface between these systems and the agent are tools, and (1) is used to instruct the model on how to use the tools effectively.

## Swarms (Definition)

A swarm is a team of agents that coordinate to get the job done. They distribute workloads, parallelize work, and when implemented well, can significantly augment the outputs of any white collar team.

Because of this, the context engineering challenges are layered on top of the existing challenges for single agents.

## Pipelines: Deterministic Code vs Agent-Executed Skills

Memory pipelines (and similar pipelines) can be expressed as deterministic code (for example: an algorithm behind a tool like a semantic search tool), or expressed in natural language using skills to be executed by agents.

- Deterministic code is cheaper, faster, and easier to test and verify.
- Agent execution is stochastic, needs its own evaluation strategies, but more capable because it understands intent and can have agency.

## Compiler Notes (Scope Disagreement)

Input: messy runtime state (graph + artifacts + receipts).
Passes: select -> rank -> budget -> compact.
Output: structured execution artifact (sometimes a `context snapshot`).
In this repo: mostly deterministic policy logic.
Optional model-assisted compaction can be enabled, but is not required for the core path.

I agree that compilation is the right word but disagree with how we've implemented it. Agentic search being the interface from which the agent interacts with the multi layered RAG system is under the umbrella of context engineering.

Compiler (we are aligned on the word; disagreement is scope):

1. deterministic seed (objective/plan/constraints/allowed tools)
2. candidate generation (agentic search + optional semantic retrieval)
3. graph expansion (neighbors along typed edges)
4. rank + budget + pack
5. verification writes evidence back; next assembly prioritizes it

## Freshness Notes

Temporal expiration is important. A context graph is only useful if the data is fresh.

It's computationally expensive to update the whole thing all the time. So the best thing is to seed it with data and then progressively update it proactively.

This can be done in a few ways:

- hooks (post-user-message reminders that trigger a subagent to refresh)
- periodic jobs / cron jobs (refresh evolving context sources like Slack, Drive, etc.)

An evolving context source is a data store that changes over time.

## Workshop Bridge: How AWS Fits

- AWS is infrastructure for the primitives:
  - DynamoDB (`GraphNodes`, `GraphEdges`) for structured state.
  - S3 for larger artifacts and logs.
  - Optional Bedrock for compaction helpers.
- The workshop does not teach AWS for AWS's sake.
- It applies context engineering concepts in a real runtime.

## What Attendees Leave With

- A reusable architecture for reliable agents in their own stack.
- A framework to evaluate any memory system or vendor claim.
- A practical way to move from single-agent demos to coordinated swarms.
- A workshop implementation they can show their team as a reference pattern.

## Open Questions (To Resolve in Slides)

- Verification: what exactly is being verified, and what counts as evidence?
- Compiler: why call it a compiler, and what is the agent-native version of it?
- Workshop activity: what do attendees do that is not "just run scripts"?
- What data sources are in-scope on day-of (repo, artifacts, receipts), and what are future extensions (Slack, Drive, etc.)?

## Research Pass (Slide-Ready Mapping)

Goal: map each source to concrete mechanisms and to the primitives we implement.

TODO: fill this after re-reading sources in detail.

- Manus: long-loop stability, recitation, tool stability, trace discipline.
- OpenAI: harness engineering, system of record, feedback loops, legibility.
- Anthropic: budgets, smallest high-signal tokens, toolset discipline, compaction/externalization.

## Workshop Activities (What Attendees Do)

Single agent:

- Practice behavior contracts: understand what is injected at boot and what must be retrieved.
- Use tools to retrieve context (search/traverse/get) and assemble a next-step view.
- Run a PLAN -> ACT -> VERIFY loop where verification writes evidence back into durable state.

Swarm:

- Run the same primitives with role separation (planner/worker/verifier).
- Coordinate via typed tasks/claims/receipts, not chat.
- Require evidence for cross-agent promotion of state.

## Slide Hooks (Draft)

1. Agent = model + harness (control loop)
2. Context engineering = attention systems engineering
3. Two levers: behavior contracts vs interfaces/tools
4. The five primitives (one slide each, or one overview slide)
5. Verification: promote trust, not text
6. Single agent -> swarm (coordination pressure)
7. Manus approach: long-loop stability (what to steal)
8. OpenAI approach: harness engineering (what to steal)
9. Anthropic approach: budgets and signal (what to steal)
10. Workshop bridge: AWS as substrate, not the lesson

## Paste Older Notes Here

PASTE HERE
