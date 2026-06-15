# synca — Collaborative Whiteboard

Real-time collaborative whiteboard (Draw.io-style). Nx monorepo: an Angular web client, a NestJS REST API, and a NestJS realtime (WebSocket) service — with Yjs CRDT sync, Redis fan-out, and Postgres persistence built out across sprints.

See `docs/superpowers/specs/` for the design and `docs/superpowers/plans/` for the sprint roadmap and per-sprint implementation plans.

## Tech stack
- **Monorepo:** Nx · npm · scope `@synca`
- **Web:** Angular 21 (Konva canvas, later sprints)
- **API / Realtime:** NestJS 11
- **Datastores:** PostgreSQL 18, Redis 8 (Docker Compose)

## Local development

Prerequisites: Node.js >= 20.19 (24 LTS recommended), npm, Docker.

```bash
npm install
npm run dev:infra      # Postgres (localhost:5434) + Redis (localhost:6380) via docker compose
npm run dev:api        # http://localhost:3000/health  -> {"status":"ok"}
npm run dev:realtime   # http://localhost:3001/health  -> {"status":"ok"}
npm run dev:web        # http://localhost:4200
```

## Quality gate

```bash
npm run check          # lint + test across all projects
npx nx e2e web-e2e     # Playwright smoke test (chromium)
```

> The workspace uses Nx's TypeScript project-references layout; Angular targets run with `NX_IGNORE_UNSUPPORTED_TS_SETUP=true`, which is already wired into the npm scripts above.
