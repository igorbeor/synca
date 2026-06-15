# Collaborative Whiteboard — Sprint Roadmap

> **Companion to:** `docs/superpowers/specs/2026-06-10-collaborative-whiteboard-design.md`
> **Planning style:** sprint-by-sprint. Each sprint is self-contained, ends in something
> demoable, and gets its **detailed bite-sized plan written just-in-time** (after the
> previous sprint completes) so later detail reflects what earlier sprints taught us.

**Goal:** Ship a real-time collaborative whiteboard for a senior/architecture portfolio,
incrementally, one demoable milestone at a time.

## Sprint sequence (approved order: front-load the visible product)

| # | Sprint | Goal | Demo at the end | Detailed plan |
|---|--------|------|-----------------|---------------|
| **0** | Walking skeleton & infra | Nx monorepo, 3 apps + shared-lib stubs, `docker-compose` (Postgres+Redis), health checks, lint/test/e2e harness | Everything boots: `nx serve` + `docker-compose up`, health checks green, smoke e2e passes | ✅ `2026-06-15-sprint-0-walking-skeleton.md` |
| **1** | Boards API + access tokens | `board-model` types, boards CRUD, board-scoped JWT join tokens, Postgres `boards` table | Create a board & get a JWT over REST | _TBW after Sprint 0_ |
| **2** | Realtime sync core (single instance) | `protocol` + `collab-core`, WS gateway, JWT handshake auth, Yjs sync | Two test clients on one board converge in real time | _TBW after Sprint 1_ |
| **3** | Whiteboard frontend (shapes + presence) | Angular + Konva canvas, shapes/text/sticky, Yjs client, live cursors/presence, share-link UX | A real multiplayer whiteboard in two browsers | _TBW after Sprint 2_ |
| **4** | Smart connectors | Anchored, re-routing connectors | draw.io-like diagramming | _TBW after Sprint 3_ |
| **5** | Persistence & durability | `board_snapshots` + `board_updates`, load/replay/compaction, Redis single-writer lock | Boards survive a server restart | _TBW after Sprint 4_ |
| **6** | Horizontal scale (Redis fan-out) | Redis pub/sub `board:{id}`, multi-instance fan-out, cross-instance integration test | Collaboration works across 2 realtime instances | _TBW after Sprint 5_ |
| **7** | Offline / reconnect resync | Client buffering + Yjs resync on reconnect | Drop network, keep editing, reconnect → converges | _TBW after Sprint 6_ |
| **8** | Live demo deploy + README | PaaS deploy, managed PG/Redis, demo GIF, architecture README | Public clickable URL | _TBW after Sprint 7_ |

_TBW = to be written (just-in-time)._

## Cross-sprint dependencies

- Sprint 0 underpins everything (workspace, libs, infra).
- Sprints 1 → 2 → 3 are a chain (tokens → sync → UI consuming both).
- Sprint 4 builds on Sprint 3's canvas.
- Sprints 5 and 6 both extend Sprint 2's realtime service; 5 (persistence) before 6 (fan-out)
  so a single board is durable before it is distributed.
- Sprint 7 extends the client + sync from Sprints 2-3.
- Sprint 8 packages whatever exists; the live demo gets more impressive each prior sprint.

## Definition of done (every sprint)

1. New code is covered by tests (unit + integration where the sprint adds behavior).
2. `nx run-many -t lint test` is green.
3. The sprint's demo can be performed locally.
4. Work is committed in small steps; the sprint ends on a clean tree.

## Conventions fixed in Sprint 0 (later sprints assume these)

- **npm scope:** `@synca` (e.g. `@synca/board-model`).
- **Apps:** `apps/web` (Angular), `apps/api` (NestJS REST), `apps/realtime` (NestJS WS).
- **Libs:** `libs/shared/{board-model,protocol,collab-core,util}` (plain TS via `@nx/js`).
- **Unit/integration tests:** Jest (Nx default). **E2E:** Playwright.
- **Local infra:** `docker-compose.yml` → Postgres 16 + Redis 7.
- **Package manager:** npm.
