# Architecture Decision Records

Significant, non-obvious design and architectural decisions for synca,
recorded as MADR-style ADRs — one file per decision, `NNNN-kebab-title.md`.
Each captures the forces at play, the rejected alternatives (concretely), and
the costs we knowingly accepted.

An ADR is **immutable once Accepted**: to change a decision, add a new ADR and
set the old one's status to `Superseded by ADR-XXXX`.

| ADR | Decision | Status | Date |
|-----|----------|--------|------|
| [0001](0001-split-api-and-realtime-services.md) | Split the backend into separate API and Realtime services | Accepted | 2026-06-10 |
| [0002](0002-yjs-crdt-for-collaboration.md) | Use the Yjs CRDT for real-time collaboration, not custom OT | Accepted | 2026-06-10 |
| [0003](0003-webpack-not-swc-for-nest-apps.md) | Build the Nest apps with webpack, not SWC (for now) | Accepted | 2026-06-15 |

These first three were back-filled from the approved design spec
(`docs/superpowers/specs/2026-06-10-collaborative-whiteboard-design.md`) and the
Sprint 0 roadmap. New decisions are added with the `/record-decision` command.
