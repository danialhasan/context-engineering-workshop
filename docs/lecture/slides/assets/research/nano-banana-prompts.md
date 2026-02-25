# Nano Banana Prompt Pack (arXiv Diagram Style)

Use with `GEMINI_GENERATE_IMAGE` and always set `model: gemini-3-pro-image-preview`.

## Global style prefix
"Create a clean arXiv-style research diagram on a pure white background. Minimal vector-like layout, thin black lines, high-contrast text, muted blue-gray boxes, no gradients, no shadows, no mascots, no decorative graphics, readable from far distance, 16:9 composition."

## Quality guardrails
- Add this suffix to every prompt:
  - "Typography must be crisp and spelling-perfect. Do not stylize text. Use plain sans-serif."
- Prefer `aspect_ratio: 16:9` and `image_size: 1K` for speed/stability.
- If the model times out, retry with a shorter prompt (keep structure, remove extra prose).

## Failure modes (lecture intro visuals)

### F1 — State drift
Title: `Failure Mode: State Drift`
Flow: `Task -> Wrong Assumption -> Bad Output`
Caption: `Unverified stale state causes incorrect action.`

### F2 — Tool ambiguity
Title: `Failure Mode: Tool Ambiguity`
Flow: `Task -> {Tool A?, Tool B?} -> Inconsistent Output`
Caption: `Ambiguous capability routing increases variance.`

### F3 — No verification
Title: `Failure Mode: No Verification`
Flow: `Claim Done -> No Evidence -> Bad State Promoted`
Visual cue: red dashed box around `No Evidence`
Caption: `Without evidence gates, low-trust claims enter shared memory.`

## Failure modes (arXiv-labeled variants)

### FA1 — State drift (labeled)
Title: `(a) State Drift`
Flow: same as F1.

### FA2 — Tool ambiguity (labeled)
Title: `(b) Tool Ambiguity`
Flow: same as F2.

### FA3 — No verification (labeled)
Title: `(c) No Verification`
Flow: same as F3.

## Anthropic

### A1 — Session handoff failure
Title: `(a) Session Handoff Problem`
Flow: `Session t -> No memory in session t+1 -> Repeated rediscovery + drift`
Caption: `Long-running agents reset context each window unless handoff artifacts are explicit.`

### A2 — Initializer to coder pattern
Title: `(b) Initializer → Coder Pattern`
Lane 1 (`Run 0: Initializer`): `Scaffold env -> Write progress file -> Initial commit`
Lane 2 (`Run N: Coder`): `Read handoff -> Implement one increment -> Verify -> Leave clean handoff`
Note: `Deterministic handoff artifacts beat transcript-only memory.`

## OpenAI

### O1 — Legibility as operating model
Title: `Harness Legibility`
Three columns: `Model` | `Harness OS` | `Human Team`
Harness OS nodes: `Repo structure`, `State docs`, `Observability`, `Tool policies`, `Verification loop`
Caption: `Reliability emerges from legible state transitions.`

### O2 — Feedback loop for autonomous coding
Title: `Observe → Act → Verify Loop`
Sequence: `Select target -> Gather traces/logs -> Propose change -> Apply -> Re-run tests/UI checks -> Promote`
Highlight loop arrow back to `Gather traces/logs`.

## Manus

### M1 — KV-cache discipline
Title: `Design Around KV-Cache`
Left panel (bad): changing prefix each step -> cache miss blocks.
Right panel (good): stable prefix + append-only tail -> cache hit retained.
Caption: `Prefix stability drives long-loop cost and latency.`

### M2 — Tool masking pattern
Title: `Mask, Don't Remove`
Left (bad): tool list changes each step.
Right (good): stable tool schema + state-based masking.
Caption: `Control action choice without breaking context consistency.`

### M3 — Externalized memory
Title: `Use the File System as Context`
Show context window linked to `files` panel with docs/paths/URLs.
Caption: `Compress context without irreversible information loss.`

### M4 — Failure-aware adaptation
Title: `Keep the Wrong Stuff In`
Flow: `Attempt -> Error trace -> Next attempt improves`
Caption: `Failure traces are evidence for adaptation, not noise.`

## Workshop bridge

### W1 — What attendees build
Title: `Workshop Harness Architecture`
Boxes: `Agent Runtime`, `Tool Interface`, `DynamoDB Context Graph`, `S3 Artifacts`, `Bedrock Inference`.
Arrows should show read/write loops and verification feedback path.

### W2 — Single agent to swarm
Title: `Single-Agent to Swarm Execution`
Left lane: single-agent loop.
Right lane: coordinator + worker agents with typed task handoffs and shared graph writes.
Caption: `Same primitives; higher coordination pressure.`
