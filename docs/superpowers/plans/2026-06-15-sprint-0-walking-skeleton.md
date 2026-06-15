# Sprint 0 — Walking Skeleton & Infra — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the Nx monorepo with three apps, four shared-lib stubs, local Postgres+Redis, health checks, and a passing smoke e2e — the wired-but-empty skeleton every later sprint builds on.

**Architecture:** Nx integrated monorepo. `apps/web` (Angular), `apps/api` (NestJS REST), `apps/realtime` (NestJS WS). Shared plain-TS libs under `libs/shared/*` (scope `@synca`). Jest for unit, Playwright for e2e. Postgres 16 + Redis 7 via docker-compose.

**Tech Stack:** Nx, Angular, NestJS, TypeScript, Jest, Playwright, Docker Compose (Postgres, Redis).

**Prerequisites:** Node.js v20.19+ and npm installed; Docker Desktop running. Current branch `feat/collaborative-whiteboard`.

---

## File Structure (created by this sprint)

```
synca/
├── apps/
│   ├── web/                         Angular app (generated)
│   ├── web-e2e/                     Playwright e2e for web (generated)
│   ├── api/                         NestJS REST app (generated)
│   │   └── src/app/health/          health.controller.ts (+ spec)
│   └── realtime/                    NestJS WS app (generated)
│       └── src/app/health/          health.controller.ts (+ spec)
├── libs/shared/
│   ├── board-model/                 stub TS lib (generated)
│   ├── protocol/                    stub TS lib (generated)
│   ├── collab-core/                 stub TS lib (generated)
│   └── util/                        stub TS lib (generated)
├── docker-compose.yml               Postgres + Redis
├── .env.example                     local env template
├── nx.json / package.json / tsconfig.base.json   (generated)
└── README.md                        updated
```

---

## Task 1: Scaffold the Nx workspace into the existing repo

The repo already exists (git history, `docs/`). `create-nx-workspace` wants a fresh dir, so we generate into a temp dir and copy the result in, preserving `.git` and `docs/`.

**Files:**
- Create: `nx.json`, `package.json`, `tsconfig.base.json`, `.editorconfig`, `.prettierrc`, etc. (all generated)
- Modify: `.gitignore` (Nx overwrites it; we re-add our line)

- [ ] **Step 1: Generate the workspace in a temp directory**

Run from the repo's parent directory:

```bash
cd /Users/igortretak/Desktop/Projects
npx create-nx-workspace@latest synca-nx --preset=apps --nxCloud=skip --packageManager=npm
```

Expected: a new `synca-nx/` directory containing `nx.json`, `package.json`, `tsconfig.base.json`, an empty `apps/` and `libs/`. (If prompted despite the flags, choose: integrated monorepo / no app yet / skip Nx Cloud.)

- [ ] **Step 2: Copy generated files into the existing repo (preserving .git and docs/)**

```bash
rsync -a --exclude='.git' /Users/igortretak/Desktop/Projects/synca-nx/ /Users/igortretak/Desktop/Projects/synca/
rm -rf /Users/igortretak/Desktop/Projects/synca-nx
cd /Users/igortretak/Desktop/Projects/synca
```

Expected: `synca/` now has `nx.json`, `package.json`, etc.; `docs/` is untouched; temp dir removed.

- [ ] **Step 3: Re-add our brainstorm ignore (Nx overwrote .gitignore) and install**

```bash
printf "\n# Brainstorming visual companion\n/.superpowers/\n" >> .gitignore
npm install
```

- [ ] **Step 4: Verify the workspace is healthy**

```bash
npx nx report
```

Expected: prints the installed `nx` version and core plugins with no errors.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: scaffold Nx workspace"
```

---

## Task 2: Add Angular/Nest plugins and generate the three apps

**Files:**
- Create: `apps/web/**`, `apps/web-e2e/**`, `apps/api/**`, `apps/realtime/**` (generated)

- [ ] **Step 1: Add the Nx plugins**

```bash
npx nx add @nx/angular
npx nx add @nx/nest
npx nx add @nx/js
```

Expected: each command installs the plugin at a version matching your Nx and updates `package.json`/`nx.json`.

- [ ] **Step 2: Generate the API app (NestJS, Jest unit tests)**

```bash
npx nx g @nx/nest:app apps/api --unitTestRunner=jest --e2eTestRunner=none --linter=eslint
```

Expected: `apps/api/src/main.ts`, `apps/api/src/app/app.module.ts`, `app.controller.ts`, `app.service.ts` (+ specs) created.

- [ ] **Step 3: Generate the Realtime app (NestJS, Jest unit tests)**

```bash
npx nx g @nx/nest:app apps/realtime --unitTestRunner=jest --e2eTestRunner=none --linter=eslint
```

Expected: same structure under `apps/realtime/`.

- [ ] **Step 4: Generate the Web app (Angular, Jest unit, Playwright e2e)**

```bash
npx nx g @nx/angular:app apps/web --unitTestRunner=jest --e2eTestRunner=playwright --style=scss --routing=true --linter=eslint
```

Expected: `apps/web/**` and `apps/web-e2e/**` (Playwright) created.

- [ ] **Step 5: Verify all three build**

```bash
npx nx run-many -t build -p api realtime web
```

Expected: three successful builds (output paths printed). If the Angular build warns about budgets, that's fine for now.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: generate web, api, realtime apps"
```

---

## Task 3: Generate the four shared-lib stubs

Plain-TS libs (framework-agnostic), import scope `@synca`.

**Files:**
- Create: `libs/shared/board-model/**`, `libs/shared/protocol/**`, `libs/shared/collab-core/**`, `libs/shared/util/**`

- [ ] **Step 1: Generate the libs**

```bash
npx nx g @nx/js:lib libs/shared/board-model --name=board-model --importPath=@synca/board-model --unitTestRunner=jest --bundler=none --linter=eslint
npx nx g @nx/js:lib libs/shared/protocol    --name=protocol    --importPath=@synca/protocol    --unitTestRunner=jest --bundler=none --linter=eslint
npx nx g @nx/js:lib libs/shared/collab-core --name=collab-core --importPath=@synca/collab-core --unitTestRunner=jest --bundler=none --linter=eslint
npx nx g @nx/js:lib libs/shared/util        --name=util        --importPath=@synca/util        --unitTestRunner=jest --bundler=none --linter=eslint
```

Expected: four libs, each with `src/index.ts`, a sample function + spec, and a `tsconfig`. The import paths are registered in `tsconfig.base.json` under `compilerOptions.paths`.

- [ ] **Step 2: Verify the import paths are registered**

```bash
grep -E "@synca/(board-model|protocol|collab-core|util)" tsconfig.base.json
```

Expected: four matching lines mapping each `@synca/*` to its `libs/shared/*/src/index.ts`.

- [ ] **Step 3: Run the generated lib tests to confirm they pass**

```bash
npx nx run-many -t test -p board-model protocol collab-core util
```

Expected: 4 projects, all tests pass.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: scaffold shared libs (board-model, protocol, collab-core, util)"
```

---

## Task 4: API health endpoint (TDD)

**Files:**
- Create: `apps/api/src/app/health/health.controller.ts`
- Test: `apps/api/src/app/health/health.controller.spec.ts`
- Modify: `apps/api/src/app/app.module.ts` (register controller)

- [ ] **Step 1: Write the failing test**

Create `apps/api/src/app/health/health.controller.spec.ts`:

```ts
import { Test } from '@nestjs/testing';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();
    controller = moduleRef.get(HealthController);
  });

  it('returns ok status', () => {
    expect(controller.check()).toEqual({ status: 'ok' });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx nx test api --testFile=health.controller.spec.ts
```

Expected: FAIL — cannot find module `./health.controller`.

- [ ] **Step 3: Write the minimal implementation**

Create `apps/api/src/app/health/health.controller.ts`:

```ts
import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  check(): { status: string } {
    return { status: 'ok' };
  }
}
```

- [ ] **Step 4: Register the controller**

In `apps/api/src/app/app.module.ts`, add the import and include `HealthController` in the `controllers` array:

```ts
import { HealthController } from './health/health.controller';
// ...
@Module({
  controllers: [AppController, HealthController],
  // providers, imports unchanged
})
export class AppModule {}
```

- [ ] **Step 5: Run the test to verify it passes**

```bash
npx nx test api --testFile=health.controller.spec.ts
```

Expected: PASS (1 test).

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/app/health apps/api/src/app/app.module.ts
git commit -m "feat(api): add /health endpoint"
```

---

## Task 5: Realtime health endpoint (TDD)

Same behavior in the realtime app so its liveness is checkable independently.

**Files:**
- Create: `apps/realtime/src/app/health/health.controller.ts`
- Test: `apps/realtime/src/app/health/health.controller.spec.ts`
- Modify: `apps/realtime/src/app/app.module.ts`

- [ ] **Step 1: Write the failing test**

Create `apps/realtime/src/app/health/health.controller.spec.ts`:

```ts
import { Test } from '@nestjs/testing';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();
    controller = moduleRef.get(HealthController);
  });

  it('returns ok status', () => {
    expect(controller.check()).toEqual({ status: 'ok' });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx nx test realtime --testFile=health.controller.spec.ts
```

Expected: FAIL — cannot find module `./health.controller`.

- [ ] **Step 3: Write the minimal implementation**

Create `apps/realtime/src/app/health/health.controller.ts`:

```ts
import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  check(): { status: string } {
    return { status: 'ok' };
  }
}
```

- [ ] **Step 4: Register the controller**

In `apps/realtime/src/app/app.module.ts`, add the import and include `HealthController` in `controllers`:

```ts
import { HealthController } from './health/health.controller';
// ...
@Module({
  controllers: [AppController, HealthController],
})
export class AppModule {}
```

- [ ] **Step 5: Run the test to verify it passes**

```bash
npx nx test realtime --testFile=health.controller.spec.ts
```

Expected: PASS (1 test).

- [ ] **Step 6: Commit**

```bash
git add apps/realtime/src/app/health apps/realtime/src/app/app.module.ts
git commit -m "feat(realtime): add /health endpoint"
```

---

## Task 6: Local infra — docker-compose (Postgres + Redis)

**Files:**
- Create: `docker-compose.yml`
- Create: `.env.example`

- [ ] **Step 1: Write `docker-compose.yml`**

```yaml
services:
  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: whiteboard
      POSTGRES_PASSWORD: whiteboard
      POSTGRES_DB: whiteboard
    ports:
      - '5432:5432'
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U whiteboard']
      interval: 5s
      timeout: 3s
      retries: 10

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    ports:
      - '6379:6379'
    healthcheck:
      test: ['CMD', 'redis-cli', 'ping']
      interval: 5s
      timeout: 3s
      retries: 10

volumes:
  pgdata:
```

- [ ] **Step 2: Write `.env.example`**

```bash
# Postgres
DATABASE_URL=postgresql://whiteboard:whiteboard@localhost:5432/whiteboard
# Redis
REDIS_URL=redis://localhost:6379
# API
API_PORT=3000
# Realtime
REALTIME_PORT=3001
# JWT (board access tokens) — set a real secret locally
JWT_SECRET=dev-secret-change-me
```

- [ ] **Step 3: Bring the services up**

```bash
docker compose up -d
```

Expected: `postgres` and `redis` containers start.

- [ ] **Step 4: Verify both are healthy**

```bash
docker compose ps
docker compose exec postgres pg_isready -U whiteboard
docker compose exec redis redis-cli ping
```

Expected: both services show `healthy`; `pg_isready` prints `accepting connections`; redis prints `PONG`.

- [ ] **Step 5: Commit**

```bash
git add docker-compose.yml .env.example
git commit -m "chore: add docker-compose with postgres and redis"
```

---

## Task 7: Web smoke e2e (Playwright)

Confirm the Angular app actually serves and renders.

**Files:**
- Modify: `apps/web-e2e/src/example.spec.ts` (rename/replace with a smoke test)
- Modify: `apps/web/src/app/app.component.html` (ensure a stable `h1` exists to assert on)

- [ ] **Step 1: Ensure the app renders a stable heading**

Replace the body of `apps/web/src/app/app.component.html` with a minimal known heading:

```html
<h1>synca whiteboard</h1>
<router-outlet></router-outlet>
```

- [ ] **Step 2: Write the smoke test**

Replace the contents of `apps/web-e2e/src/example.spec.ts` with:

```ts
import { test, expect } from '@playwright/test';

test('web app loads and shows the heading', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'synca whiteboard' })).toBeVisible();
});
```

- [ ] **Step 3: Run the e2e to verify it passes**

```bash
npx nx e2e web-e2e
```

Expected: PASS — Playwright starts the dev server, loads `/`, finds the heading. (First run may download Playwright browsers; if so run `npx playwright install` once and re-run.)

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/app.component.html apps/web-e2e/src/example.spec.ts
git commit -m "test(web): add smoke e2e for app load"
```

---

## Task 8: Developer ergonomics, README, and full verification

**Files:**
- Modify: `package.json` (root convenience scripts)
- Modify: `README.md`

- [ ] **Step 1: Add convenience scripts**

In root `package.json`, add to the `scripts` object (keep any Nx-generated scripts):

```json
{
  "scripts": {
    "dev:infra": "docker compose up -d",
    "dev:api": "nx serve api",
    "dev:realtime": "nx serve realtime",
    "dev:web": "nx serve web",
    "check": "nx run-many -t lint test"
  }
}
```

- [ ] **Step 2: Rewrite `README.md`**

Replace `README.md` with:

```markdown
# synca — Collaborative Whiteboard

Real-time collaborative whiteboard (Draw.io-style). Nx monorepo: Angular web client,
NestJS REST API, NestJS realtime (WebSocket) service, Yjs CRDT sync, Redis fan-out,
Postgres persistence.

See `docs/superpowers/specs/` for the design and `docs/superpowers/plans/` for the
sprint roadmap and per-sprint implementation plans.

## Local development

```bash
npm install
npm run dev:infra      # Postgres + Redis via docker compose
npm run dev:api        # http://localhost:3000/health
npm run dev:realtime   # http://localhost:3001/health
npm run dev:web        # http://localhost:4200
```

## Quality gate

```bash
npm run check          # lint + test across all projects
```
```

- [ ] **Step 3: Run the full quality gate**

```bash
npx nx run-many -t lint test
```

Expected: all projects lint clean and all tests pass (the four lib sample tests + the two health specs + any generated app specs).

- [ ] **Step 4: Manual smoke of both services**

In separate terminals:

```bash
npm run dev:api
# then in another shell:
curl -s localhost:3000/health
```

Expected: `{"status":"ok"}`. Repeat for realtime on port 3001 (`npm run dev:realtime`, then `curl -s localhost:3001/health`).

> If the api/realtime default port isn't 3000/3001, set it via `process.env.API_PORT`/`REALTIME_PORT` in each app's `main.ts` (the generated `main.ts` reads a `port` constant — point it at the env var with a fallback). Adjust the curl/port accordingly.

- [ ] **Step 5: Final commit**

```bash
git add package.json README.md apps/api/src/main.ts apps/realtime/src/main.ts
git commit -m "chore: dev scripts, README, and port config"
```

---

## Sprint 0 Definition of Done

- [ ] `npx nx run-many -t lint test` is green across all projects.
- [ ] `npx nx e2e web-e2e` passes.
- [ ] `docker compose ps` shows Postgres + Redis healthy.
- [ ] `curl localhost:3000/health` and `curl localhost:3001/health` both return `{"status":"ok"}`.
- [ ] `nx serve web` renders the heading at `http://localhost:4200`.
- [ ] Working tree is clean; all work committed on `feat/collaborative-whiteboard`.

## Next

After Sprint 0 is green, write the **Sprint 1** detailed plan (Boards API + access tokens):
`docs/superpowers/plans/<date>-sprint-1-boards-api.md`.
