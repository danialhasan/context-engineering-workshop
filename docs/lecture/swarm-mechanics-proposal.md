# Context Engineering with Agent Swarms

## Final Section Intent
This section bridges single-agent context engineering and multi-agent coordination.

Core thesis:
- Swarms are not a new theory.
- They are the same context-engineering primitives under higher coordination pressure.
- Reliability comes from layering swarm coordination mechanics on top of single-agent mechanics.

## General Ideas (for lecture flow)
1. Baseline invariants
- Keep the same primitives: ontology, memory, tools, verification.
- These invariants fail faster under parallelism without coordination controls.

2. Coordination contract
- Typed work units and typed handoffs replace free-text coordination.
- Ambiguous handoffs create drift, hidden blockers, and duplicate effort.

3. Shared-state architecture
- Role-local working memory for speed and focus.
- Global context graph for team-visible durable state.
- Artifact/receipt store for evidence and auditability.

4. Role-scoped capabilities
- Different roles should have different tool rights.
- Capability boundaries are a reliability mechanism, not a limitation.

5. Swarm control loop
- plan -> assign -> execute -> verify -> merge -> replan
- Leases, timeouts, and reassignments prevent dead tasks and stuck ownership.

6. Promotion discipline
- Local done is not global trusted.
- Cross-agent promotion requires evidence via verification gates.

7. Conflict + freshness policy
- Contradictions are expected in parallel systems.
- Resolve with versioning, confidence, timestamps, TTL, and merge policy.

## Mechanics Layering Model

### Layer 1: Single-agent mechanics (already covered)
- Instruction contracts (`system` + behavior contracts)
- Retrieval and context assembly at runtime
- Tool contracts + schema validation
- Local verification before action progression

### Layer 2: Swarm mechanics (added in this section)
- Typed handoff contracts
- Role-scoped tool rights
- Shared-memory topology (local + global + artifacts)
- Coordination loop (queue/claim/lease/timeout/reassign)
- Global promotion gate for trusted shared state
- Conflict/freshness policy for contradiction resolution

### Layering principle
Single-agent mechanics optimize correctness for one loop.
Swarm mechanics preserve correctness across many loops acting in parallel.

## Slide Proposal (implemented as lead-in before detailed swarm slides)
1. Context Engineering with Agent Swarms
- Message: same primitives, new coordination mechanics.

2. Mechanics Layering
- Visualize base layer (single-agent) + overlay layer (swarm coordination).

3. Trust Boundaries in Swarms
- Clarify local truth vs global trusted state and where promotion gates sit.

Then continue into the detailed swarm mechanics slides:
- Single Agent -> Swarm
- Swarm Problem
- Swarm Failure Modes
- Swarm Ontology
- Typed Handoffs
- Memory Topology
- Role-Scoped Tool Rights
- Coordination Control Loop
- Verification Gates
- Conflict + Freshness Policy
- Swarm Runtime Loop
- What You'll Implement
