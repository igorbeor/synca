# ADR-0003: Build the Nest apps with webpack, not SWC (for now)

- Status: Accepted
- Date: 2026-06-15
- Deciders: Ihor Tretiak

## Context
`@synca/api` and `@synca/realtime` rely on decorator metadata
(`emitDecoratorMetadata`) for Nest DI, guards, pipes, and `class-validator`.
Sprint 0 must pick an Nx build executor for the two Nest apps.

## Decision
We will use Nx's webpack executor for both Nest apps.

## Alternatives considered
### SWC (`@nx/js:swc`) — rejected (for now)
How it would work: SWC compiles the apps far faster than webpack, with its
plugin and `tsconfig` configured to re-emit decorator metadata.
Why rejected: out of the box SWC emits no decorator metadata, so Nest
DI/guards/`class-validator` break until that setup is done and verified — a
cost not justified by current build/serve times.

### Vite — rejected (not applicable)
Why rejected: Vite is a browser/frontend bundler, not a Node/Nest server
build. The Angular `web` app already uses the esbuild/Vite-based builder, but
it isn't the relevant choice for the Nest services.

## Consequences
- (+) Nest DI and validation work with zero extra configuration.
- (−) Slower build/serve than SWC.
- Revisit if: build/serve time becomes a pain point — then invest in the SWC
  plugin + `tsconfig` (verify the current Nx Nest + SWC setup first) and keep
  all tests green after the switch.
