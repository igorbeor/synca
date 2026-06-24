# ADR-0001: Split the backend into separate API and Realtime services

- Status: Accepted
- Date: 2026-06-10
- Deciders: Ihor Tretiak

## Context
The platform has two backend workloads with genuinely different shapes
(approved design spec §3): stateless board CRUD and board-JWT issuance, versus
stateful WebSocket connections that hold in-memory Yjs documents and fan out
live updates. They scale differently — the CRUD path scales horizontally with
no coordination, while the WS path is connection- and memory-bound and needs
cross-instance coordination. A guiding rule of the project is that every
service boundary must be *earned*, not assumed.

## Decision
We will run two deployable NestJS services: `@synca/api` (stateless REST +
board-scoped JWT issuance) and `@synca/realtime` (stateful WS gateway holding
in-memory `Y.Doc`s), coordinated by Redis pub/sub for cross-instance fan-out.

## Alternatives considered
### Single monolith (one Nest app for REST + WS) — rejected
How it would work: one service exposes the REST endpoints and the WebSocket
gateway together.
Why rejected: couples a trivially-scalable stateless workload to a
connection-bound stateful one — they would scale and deploy as a unit, and the
in-memory CRDT state would make the whole app stateful, undoing the easy
horizontal scaling of the CRUD path.

### Full microservices (decompose by domain) — rejected
How it would work: separate services for boards, auth, presence, persistence,
and so on.
Why rejected: the boundaries aren't earned by real scaling differences; the
operational overhead is unjustified for a focused project and would spread
depth thin — an explicit anti-goal of the design.

## Consequences
- (+) Each service scales on its own profile; the API scales with no
  coordination, the realtime tier scales on connection count.
- (+) A clean, reviewable boundary: `api` never opens a socket and `realtime`
  never serves CRUD.
- (−) Cross-instance fan-out becomes a required problem (solved with Redis
  pub/sub on `board:{id}`).
- (−) Two services plus shared libs to build, test, and deploy instead of one.
- Revisit if: the realtime tier collapses to a single instance with no
  horizontal-scaling story (one app would be simpler), or conversely if
  independent bounded contexts emerge that earn finer decomposition.
