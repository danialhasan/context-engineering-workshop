# Gemini Prompt Pack: Research Section (Single-Focus Slides)

Use these prompts one-by-one in Gemini. Each prompt is intentionally single-focus.

## Global style block (prepend to every prompt)

```text
Create one 16:9 slide in an arXiv-paper figure style. White background, black text, thin vector lines, muted pastel accents, concise labels, and high readability from the back of a room. Prefer one idea per slide. No glossy effects, no heavy gradients, no tiny annotations.
```

## Slide R1: Section opener

```text
Create a section slide titled "Research Findings: Anthropic, OpenAI, Manus". Subtitle: "What each lab discovered, and what we steal for implementation." Keep layout minimal with strong hierarchy.
```

## Slide R2: Comparison frame

```text
Create a comparison slide titled "Three Labs, Three Lenses". Show a 3-column table with headers: Anthropic, OpenAI, Manus. Row labels: Primary focus, Core mechanism, Failure they target, What we implement. Keep each cell short.
```

## Slide R3: Anthropic core problem

```text
Create a slide titled "Anthropic: Long Runs Lose Context". Main statement: "Each context window is a new shift with memory loss." Add a simple visual: sequential windows with fading state continuity.
```

## Slide R4: Anthropic pattern

```text
Create a slide titled "Anthropic Pattern: Initializer -> Coder". Show a two-stage flow diagram:
Stage 1: Initializer Agent (setup + scaffolding)
Stage 2: Coding Agent (incremental implementation).
Caption: "Role separation improves continuity over long-running work."
```

## Slide R5: Anthropic reliability insight

```text
Create a slide titled "Anthropic: 'Done' Claims Are Fragile". Main point: "Agents over-claim completion without explicit end-to-end checks." Show a small flow: Claim Done -> Missing E2E -> Hidden Failure.
```

## Slide R6: Anthropic practical fix

```text
Create a slide titled "Anthropic Fix: Force User-Like Verification". Bullets:
- Browser-level checks
- End-to-end validation
- Not only unit tests/curl
Keep one supporting icon per bullet.
```

## Slide R7: OpenAI core claim

```text
Create a slide titled "OpenAI: Environment Design Beats Prompt Tweaks". Main statement: "Speed and reliability come from harness design." Add a simple system diagram: Human Intent -> Harness -> Agent Execution -> Feedback.
```

## Slide R8: OpenAI legibility

```text
Create a slide titled "OpenAI: Make Systems Legible to Agents". Show a left-right map:
Left: AGENTS.md (map)
Right: docs/ (system of record)
Bottom: code/tests/logs as navigable evidence.
```

## Slide R9: OpenAI mechanical enforcement

```text
Create a slide titled "OpenAI: Enforce Architecture Mechanically". Bullets:
- Lint
- Test
- Structure checks
Closing line: "Codified constraints prevent drift at scale."
```

## Slide R10: OpenAI entropy management

```text
Create a slide titled "OpenAI: Throughput Creates Entropy". Main point: "High agent throughput replicates bad patterns unless you run continuous cleanup." Show loop: Agent throughput -> Pattern replication -> Garbage collection -> Stable baseline.
```

## Slide R11: Manus core strategy

```text
Create a slide titled "Manus: Optimize Context Engineering, Not Training". Main statement: "Production wins came from context systems iteration speed." Add a simple contrast graphic: Model retraining (slow) vs context engineering (fast).
```

## Slide R12: Manus systems metric

```text
Create a slide titled "Manus: KV-Cache Hit Rate Is a First-Class Metric". Show a 2-axis chart placeholder with annotations for latency and cost impact as cache hit rate changes.
```

## Slide R13: Manus tool discipline

```text
Create a slide titled "Manus: Mask, Don't Remove Tools". Show two paths:
Path A (bad): remove tool definitions mid-loop -> instability
Path B (good): stable tool schema + capability gating -> continuity
```

## Slide R14: Manus attention discipline

```text
Create a slide titled "Manus: Recitation Keeps Plans in Attention". Show timeline with recurring recitation checkpoints and reduced drift over time.
```

## Slide R15: Manus learning loop

```text
Create a slide titled "Manus: Keep Failures in the Trace". Main statement: "Wrong turns are evidence for adaptation." Diagram: Error -> Trace -> Recovery update -> Better next step.
```

## Slide R16: Synthesis bridge

```text
Create a slide titled "Synthesis: What We Steal". Three bullets:
- Anthropic: Initializer -> Coder + explicit E2E verification
- OpenAI: Harness legibility + system of record
- Manus: Long-loop stability heuristics
Footer: "This becomes our workshop architecture."
```

## Slide R17: Implementation mapping

```text
Create a slide titled "Research -> Primitives -> Harness". Draw a 3-layer mapping:
Layer 1: Anthropic / OpenAI / Manus
Layer 2: Ontology, Context Graph, Skill Graph, Assembly, Verification
Layer 3: DynamoDB, S3, Bedrock(optional), Tool Contracts, Evidence Gates
Use arrows from each source to the primitives it informs.
```

## Slide R18: Transition to workshop

```text
Create a transition slide titled "Now We Build It". Subtitle: "Initializer gives scaffold. Coder agents complete implementation with TDD and verification." Keep very minimal.
```

