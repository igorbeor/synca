# Collaborative Whiteboard Platform — Design Spec

**Date:** 2026-06-10
**Status:** Approved (design) — ready for implementation planning

---

## 1. Goal & Context

Build a real-time collaborative whiteboard (Draw.io-style) as a portfolio project whose
purpose is to **help land a senior / architecture-focused role faster**.

Because the audience is senior reviewers, the project optimizes for **demonstrating
architectural judgment**, not feature count. The guiding principle throughout: every
boundary and dependency must be *justified*, and depth is concentrated in one hard
problem rather than spread thin.

- **Target audience:** senior / architecture roles (Angular + NestJS stack).
- **Time budget:** ~2–4 weeks, near full-time focus (~80–160 hrs). An unfinished
  ambitious project hurts more than a small polished one.
- **Centerpiece (where depth goes):** the **real-time collaboration engine** and the
  distributed system around it.

## 2. Success Criteria

1. A **publicly hosted, clickable live demo** — two people open the same link and
   collaborate in real time (shapes, connectors, live cursors).
2. The codebase reads like something a senior engineer would be proud to show in review:
   clean bounded contexts, type-safe contracts across the stack, first-class tests.
3. The README tells the architecture story clearly: system diagram, the hard problems
   solved (WS-layer auth, cross-instance fan-out, CRDT persistence/compaction,
   offline/reconnect), a demo GIF, and the live URL.
4. Runs locally with a single `docker-compose up`.

## 3. Architecture

**Pattern: API + Realtime split** (a justified 2-service split, *not* full
microservices and *not* a single monolith). The split is earned by genuinely different
scaling profiles: stateless CRUD vs. stateful WebSocket connections holding in-memory
CRDT documents.

```
            Clients (different browsers / users)
   ┌─────────────────────────┐   ┌─────────────────────────┐
   │ User A — Angular SPA     │   │ User B — Angular SPA     │
   │ Konva canvas · Yjs doc   │   │ Konva canvas · Yjs doc   │
   └───────────┬─────────────┘   └───────────┬─────────────┘
        REST ↑ │ load/create        WebSocket ↕ live sync
               │                                 │
   ┌───────────▼─────────────┐   ┌───────────────▼───────────────┐
   │ API service (stateless) │   │ Realtime Collab ×N (stateful)  │
   │ boards CRUD             │   │ WS gateway · in-mem Yjs docs    │
   │ issues board JWT        │   │ awareness · persistence        │
   └───────────┬─────────────┘   └───────┬────────────────┬───────┘
               │                  fan-out │                │ persist
               │                 ┌────────▼──────┐  ┌──────▼────────┐
               └────────────────►│ Postgres      │  │ Redis pub/sub │
                                 │ meta + Yjs     │  │ board:{id}    │
                                 │ snapshots+log  │  │ fan-out+lock  │
                                 └───────────────┘  └───────────────┘
```

- **API service (NestJS, stateless):** create/load boards; issue short-lived,
  board-scoped JWTs that authorize WebSocket connections. Scales horizontally with no
  coordination.
- **Realtime Collab service (NestJS, stateful, N instances):** WebSocket gateway holding
  in-memory `Y.Doc`s and awareness state. The depth lives here.
- **Redis:** pub/sub on `board:{id}` so an update received by one Realtime instance
  reaches clients connected to *every other* instance (the horizontal-scaling story).
  Also provides a per-board persister lock.
- **Postgres:** board metadata + persisted Yjs snapshots and incremental update log.

## 4. Real-Time Collaboration Engine (Centerpiece)

**CRDT library: Yjs.** A deliberate judgment call — do not reinvent a CRDT; use a proven
one and invest depth in the distributed system around it. The hard, *owned* problems:

1. **WebSocket-layer authorization.** The Realtime service verifies the board-scoped JWT
   on the WS handshake (claim `board:{id}`, role `editor`) and rejects anything else.
2. **Cross-instance fan-out.** Yjs docs are per-instance and in-memory. An incoming
   update is applied locally, then published to Redis `board:{id}`; every subscribed
   instance rebroadcasts to its own connected clients. This is what makes the system
   horizontally scalable rather than single-node.
3. **Persistence + compaction.** Updates are appended cheaply to an update log; on a
   debounce/interval the in-memory doc is written as a fresh snapshot and consumed
   updates are truncated. Keeps load fast and storage bounded.
4. **Single-writer election.** A Redis lock elects one instance per board as the
   persister so multiple instances never race on the same board's writes.
5. **Offline / reconnect resync.** Clients apply edits optimistically and buffer while
   disconnected; on reconnect the Yjs sync protocol exchanges state vectors and
   reconciles with zero conflicts.
6. **Presence/awareness.** Live cursors, name tags, and remote selection ride the Yjs
   awareness protocol — ephemeral, never persisted, fanned out the same way as document
   updates.

**Edit lifecycle (User A moves a shape):**

1. Konva emits change → client mutates its local `Y.Doc` and re-renders optimistically.
2. Yjs emits a binary update → sent over WebSocket to A's Realtime instance.
3. Instance authorizes via the board JWT, applies the update, publishes to Redis
   `board:{id}`.
4. Every subscribed Realtime instance receives it and broadcasts to its clients.
5. User B's client applies the update → Konva re-renders. Cursors ride the same path via
   awareness.
6. Debounced, the elected persister writes a snapshot to Postgres and truncates consumed
   updates.
7. On reconnect, the Yjs sync protocol reconciles buffered local edits.

## 5. Monorepo Structure (Nx)

Nx is chosen for first-class Angular + NestJS support and, critically, for **sharing
typed code between frontend and backend** so contract changes are compile errors, not
runtime surprises.

```
ng-chat/                       Nx workspace
├── apps/
│   ├── web/                   Angular SPA — Konva canvas, board UI, Yjs client
│   ├── api/                   NestJS — stateless REST: boards CRUD, board-token issuance
│   └── realtime/              NestJS — WS gateway, Yjs sync, Redis fan-out, persistence
├── libs/
│   ├── shared/board-model/    TS types: shape/object schema + Yjs doc shape  (web+api+realtime)
│   ├── shared/protocol/       WS message + awareness protocol contract        (web+realtime)
│   ├── shared/collab-core/    framework-agnostic Yjs helpers: doc init,
│   │                          encode/decode, persistence (de)serialization,
│   │                          compaction                                       (web+realtime)
│   └── shared/util/           ids, env, logging
├── docker-compose.yml         api · realtime · postgres · redis (local dev)
└── e2e/                       Playwright multi-client collaboration tests
```

**Boundary discipline:** `api` never opens a socket; `realtime` never serves CRUD;
`collab-core` is framework-agnostic and unit-testable in isolation. Each unit has one
clear purpose, a defined interface, and explicit dependencies.

## 6. Frontend (Angular + Konva)

- **Rendering: Konva.js** — 2D canvas scene graph with built-in dragging, transformers
  (resize handles), and layers; stays performant as object + cursor counts grow.
- **State model:** the Yjs doc is the single source of truth. Angular components dispatch
  intent; Konva renders; Yjs changes drive re-render (signals). The Angular layer stays
  thin.
- **UI surface (approved wireframe):** left tool rail (select, rectangle, ellipse,
  line/arrow, pen, text, sticky, connector); top bar with live presence (avatars + live
  count) and a Share link; canvas with selection handles, re-routing connectors, sticky
  notes, and remote cursors with name tags.
- **Smart connectors:** anchored to shape edges, straight/orthogonal, re-route when
  shapes move. **No** obstacle-avoiding auto-routing in MVP.

## 7. Data Model & Persistence

```
boards          ( id uuid pk, name text, created_at, updated_at )
board_snapshots ( board_id fk, state bytea, version int, created_at )  -- debounced full Yjs state
board_updates   ( id pk, board_id fk, update bytea, created_at )       -- append-only incremental updates
```

- **Load:** latest snapshot + replay `board_updates` since it → reconstruct `Y.Doc` in
  memory → send initial state to the joining client via the Yjs sync protocol.
- **Save:** append incoming updates (cheap); on debounce/interval write a new snapshot and
  truncate consumed updates (compaction). Coordinated by the Redis single-writer lock.
- **Presence:** ephemeral, never persisted.

## 8. Access & Auth

- `POST /boards` → create board, return `boardId` + share URL.
- `POST /boards/:id/join` → return a short-lived **board-scoped JWT** (`board:{id}`, role
  editor); client supplies a display name.
- Realtime service **verifies the JWT on the WS handshake** and rejects anything else.
- **MVP:** anonymous shareable links; all link-holders are editors.
- **Fast-follow:** Google OAuth — the token then carries a real user identity and
  owner/editor roles.

## 9. MVP Scope & Non-Goals

**In scope:** anonymous shareable links + board JWT WS auth; Konva canvas (rectangle,
ellipse, line/arrow, pen, text, sticky; move/resize/delete; color); smart connectors
(re-route on move); live presence (cursors, name tags, selection highlight, avatars +
count); Yjs real-time sync with optimistic apply and offline/reconnect resync; API +
Realtime services; Redis fan-out + single-writer lock; Postgres snapshots + update log
with compaction; `docker-compose` local; deployed live demo; polished README.

**Explicit non-goals (post-MVP):** user accounts / dashboard / multi-board management UI;
Google OAuth (fast-follow); PNG/SVG export; collaborative rich-text inside notes (notes
are whole-field LWW); obstacle-avoiding connector routing; comments / version-history UI;
permission roles beyond editor; mobile-optimized UI; Kubernetes / full IaC / heavy CI/CD.

## 10. Testing Strategy (first-class)

- **Unit:** `collab-core` (doc helpers, encode/decode, persistence serialization,
  compaction) and connector anchoring geometry. Pure, fast.
- **Integration:** Realtime service — two simulated clients converge; Redis fan-out
  across two instances; persistence load → replay → compaction; JWT rejection on
  handshake.
- **E2E (Playwright, multi-client):** two browser contexts on one board — edit in one,
  assert the other updates; presence cursors; reconnect resync.

The convergence + fan-out tests are the proof the engine works and are a deliberate
portfolio signal.

## 11. Deployment

- **Local:** `docker-compose.yml` runs web, api, realtime, postgres, redis.
- **Live demo:** deploy api + realtime to a PaaS (Fly.io / Render) with managed Postgres
  + Redis; web served as static; single public URL; health checks; env config via
  `shared/util`.

## 12. Tech Stack Summary

| Layer            | Choice                                             |
|------------------|----------------------------------------------------|
| Monorepo         | Nx                                                 |
| Frontend         | Angular + Konva.js, Yjs client                     |
| API service      | NestJS (REST), JWT board tokens                    |
| Realtime service | NestJS WS gateway, Yjs, awareness                  |
| CRDT             | Yjs                                                |
| Messaging        | Redis pub/sub (`board:{id}`) + per-board lock      |
| Persistence      | Postgres (snapshots + update log, compaction)      |
| Tests            | Unit + integration + Playwright multi-client E2E   |
| Local dev        | docker-compose                                     |
| Hosting          | PaaS (Fly.io / Render) + managed Postgres & Redis  |

## 13. Risks & Mitigations

- **Scope overrun in 2–4 weeks.** Connectors + presence + distributed backend is a full
  load. *Mitigation:* engine first; connectors scoped to re-route-on-move only; board
  management deferred; ruthless non-goals.
- **Cross-instance fan-out complexity.** *Mitigation:* integration tests across two
  instances early; treat it as the riskiest path and validate it first.
- **Persistence races.** *Mitigation:* Redis single-writer lock per board; snapshots are
  full-state and idempotent on load.
- **Yjs "just glue" perception.** *Mitigation:* README foregrounds the owned hard
  problems (WS auth, fan-out, persistence/compaction, offline resync) and the tests that
  prove them.

## 14. Post-MVP Roadmap

Google OAuth + ownership/roles → board dashboard & multi-board management → PNG/SVG export
→ version history → comments → mobile UX → optional CI/CD pipeline.
