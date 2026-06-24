# ADR-0002: Use the Yjs CRDT for real-time collaboration, not custom OT

- Status: Accepted
- Date: 2026-06-10
- Deciders: Ihor Tretiak

## Context
Multiple users edit one board concurrently and must keep editing while briefly
offline, converging on reconnect with no central arbiter of operation order
(approved design spec §4). A core project principle is to concentrate depth in
the *distributed system* around collaboration — WS-layer auth, cross-instance
fan-out, persistence/compaction, reconnect resync — rather than in reinventing
a conflict-resolution algorithm.

## Decision
We will model board state as Yjs (`Y.Doc`) documents: clients apply edits
optimistically, binary Yjs updates sync over WebSocket, and the realtime
service applies, fans out (Redis), and persists them. Presence rides the Yjs
awareness protocol. (Rich text inside sticky notes is intentionally
whole-field last-write-wins, not a CRDT — a scoped simplification.)

## Alternatives considered
### Custom Operational Transform (OT) — rejected
How it would work: a central authority transforms each client operation
against concurrent operations so all clients converge on one order.
Why rejected: requires an authoritative transform service and error-prone
per-operation transform functions; high cost to build correctly for no gain
over a proven CRDT.

### Hand-rolled CRDT — rejected
How it would work: implement our own CRDT types and merge logic.
Why rejected: high risk and time for zero differentiation — the intended depth
is the distributed system around the CRDT, not the CRDT itself.

### Last-write-wins over the whole board — rejected
Why rejected: silently drops concurrent edits, the exact failure collaboration
must avoid. (LWW is acceptable only for whole-field note text, where conflict
granularity doesn't matter.)

## Consequences
- (+) Concurrent and offline edits converge automatically; optimistic apply
  plus reconnect resync come from the Yjs sync protocol.
- (+) Presence/awareness reuses the same transport and fan-out path.
- (+) The server stays "apply + fan-out + persist," keeping the owned
  complexity where the depth is meant to be.
- (−) The binary Yjs update/snapshot format must be persisted and compacted
  (snapshots + an append-only update log).
- (−) The team must understand the CRDT/Yjs model to debug sync issues.
- Revisit if: a requirement appears for server-authoritative validation of
  every edit (e.g. per-object permissions), which CRDTs make awkward.
