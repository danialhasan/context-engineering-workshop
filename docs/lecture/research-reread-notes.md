Perfect push. I re-read all three and here’s the richer version.

You were remembering this section in repo: [lecture.md](/Users/danialhasan/dev/context-engineering-workshop/lecture.md:33) and [docs/lecture/my-notes.md](/Users/danialhasan/dev/context-engineering-workshop/docs/lecture/my-notes.md:163).

**Anthropic (Nov 26, 2025): Effective harnesses for long-running agents**
- Core problem: each context window is a new “shift” with memory loss.
- Main pattern: `initializer agent` sets up environment once, `coding agent` makes incremental progress per run.
- Persistence discipline: require clean handoff artifacts each run (`git` commits + progress file summaries).
- Reliability insight: agents over-claim “done” unless prompted for true end-to-end verification.
- Practical fix: force user-like testing workflows (browser automation), not only unit tests/curl.
- Important nuance: same harness/tools can work; prompt role separation alone can create initializer vs coder behavior.
- Open research edge: specialized multi-agent roles (testing/QA/cleanup) may outperform one general coder.

**OpenAI (Feb 11, 2026): Harness engineering**
- Core claim: speed comes from environment design, not just model prompts.
- Operating model: humans steer intent; agents execute almost everything.
- Biggest lever: make systems legible to agents (repo, UI, logs, metrics, traces).
- Knowledge architecture: short `AGENTS.md` as map, rich `docs/` as system of record.
- Mechanical enforcement: linters/tests/structure checks enforce architecture and taste boundaries.
- Throughput adaptation: high agent throughput changes merge philosophy; cheap correction can beat long blocking.
- Autonomy threshold: once testing/review/recovery loops are encoded, agents can drive full feature loops.
- Entropy management: agents replicate bad patterns; you need recurring “garbage collection” and golden principles.

**Manus (Jul 18, 2025): Context engineering in production**
- Core strategy: optimize context engineering instead of model training for fast product iteration.
- Primary systems metric: KV-cache hit rate (latency + cost impact is huge in long loops).
- Context discipline: stable prefixes, append-only traces, deterministic serialization, explicit cache breakpoints.
- Tooling discipline: “mask, don’t remove” tools mid-loop to avoid cache invalidation + schema confusion.
- Memory strategy: filesystem as external memory; compression should be restorable (keep pointers like paths/URLs).
- Attention control: recitation (`todo.md`) keeps objective near recent attention and reduces drift.
- Learning loop: keep failure traces; wrong turns are evidence for adaptation.
- Anti-pattern: repetitive context can over-few-shot the model into bad local habits; introduce controlled diversity.

**Synthesis (what to steal into your lecture/workshop)**
- Anthropic gives the session-bridging execution pattern (`initializer -> coder`) and explicit E2E verification pressure.
- OpenAI gives the harness architecture and legibility/system-of-record doctrine.
- Manus gives the long-loop operational heuristics for cost, stability, and drift control.
- Combined: agent-native retrieval/assembly + deterministic guardrails + evidence-gated promotion.

Sources:
- https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents
- https://openai.com/index/harness-engineering/
- https://manus.im/blog/Context-Engineering-for-AI-Agents-Lessons-from-Building-Manus
