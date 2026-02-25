# Workshop Swarm Gap Closure TODO

Date: 2026-02-25  
Scope: close lecture-to-workshop implementation gaps for swarm context-engineering showcase.

## Gaps Identified

- [x] Swarm route wiring regression (`/swarm` path was not normalized in GUI router).
- [x] Swarm heartbeat counts mismatch (`coordination.state_counts` expected by UI but backend only emitted `counts`).
- [x] Missing first-class swarm communication tools (channel/message primitives were absent from allowlisted skills).
- [x] Ontology did not expose core swarm communication entities and relationships.
- [x] Scenario suite had no dedicated communication-handoff exercise.
- [x] Workshop docs still framed Bedrock as optional instead of the primary inference path.

## Implemented Fixes

- [x] Added `ROUTES.SWARM` + route normalization in React GUI.
- [x] Added backend `state_counts` alias and communication projection for glass-case payloads.
- [x] Added skills:
  - `create_channel`
  - `post_channel_message`
  - `list_channel_messages`
- [x] Added dispatcher execution paths with schema validation, provenance, and graph linkage.
- [x] Extended ontology with `Agent`, `Role`, `Channel`, `Message`, `Lease`, `Dependency` and matching edges.
- [x] Added Scenario `F` (channel handoff) and updated scenario runbook.
- [x] Updated workshop docs for Bedrock-first inference posture.

## Residual Notes

- External business-system adapters (`external.*`) remain intentionally stubbed and marked with `TODO(external-system)` until those in-repo systems are implemented.
