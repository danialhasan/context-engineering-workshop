# Research Source Map (Problem / Constraints / Solution)

Purpose: keep lecture claims lossless to primary sources while staying in plain language.

## Anthropic — Effective harnesses for long-running agents
Source: https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents

### Problem (plain language)
- Long-running tasks cross many context windows, and each new session starts memory-cold.
- Agents either overreach (try to one-shot too much) or underreach (declare "done" early).
- Compaction helps, but handoffs still fail if session state is not explicitly externalized.

### Constraints (plain language)
- Reliability must hold across many windows, not just one prompt.
- Context is finite; important state must be curated and transferred deliberately.
- Every run must leave a clean, merge-ready state for the next run.

### Solution pattern (plain language)
- Split prompts by role: initializer run then coder runs.
- Initializer creates scaffold and handoff artifacts (`init.sh`, progress file, initial commit, feature framing).
- Coder performs incremental delivery per run and leaves explicit state for the next session.

## OpenAI — Harness engineering
Source: https://openai.com/index/harness-engineering/

### Problem (plain language)
- Strong model outputs are not enough if process state is opaque.
- Agents can only reason over what they can see; unseen context creates blind spots.
- Without harness legibility, debugging, handoffs, and reproducibility degrade.

### Constraints (plain language)
- Must work in real software systems (repo boundaries, tests, runtime, observability).
- Teams need human-readable state and repeatable feedback loops.
- Throughput is high; correction loops must be fast and operationally practical.

### Solution pattern (plain language)
- Treat the harness as the operating system around the model.
- Make architecture and state legible to both humans and agents (`AGENTS.md`, docs, boundaries).
- Close loops with observability + verification + reruns, not one-pass generation.

## Manus — Context Engineering for AI Agents: Lessons from Building Manus
Source: https://manus.im/blog/Context-Engineering-for-AI-Agents-Lessons-from-Building-Manus

### Problem (plain language)
- Long tool trajectories bloat context and increase drift risk.
- KV-cache misses make long-loop latency/cost much worse.
- Repetitive traces can over-condition behavior and reduce robustness.

### Constraints (plain language)
- Production loops require cheap, continuous context updates.
- Tool-rich action spaces must remain stable while still being controllable.
- Failures are common; removing them can erase useful adaptation signal.

### Solution pattern (plain language)
- Optimize around KV-cache stability (stable prefixes + append-only deterministic traces).
- Mask tools instead of removing tools mid-loop.
- Use filesystem as external memory, recitation (`todo.md`) for attention steering, and keep failure traces in context.

## Cross-lab synthesis (for slides)
- Same root problem: keep high-signal, trustworthy, actionable context in long-running loops.
- Different operating constraints produce different implementation patterns.
- Shared invariants: explicit state, controlled tooling, bounded context assembly, evidence-backed progress.
