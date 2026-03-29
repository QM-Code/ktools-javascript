# SDK Demo Modules

The `demo/sdk/` files are reusable tracing examples imported by the executable
demos.

Each demo module is intentionally self-contained so the layout is easy to
compare with the other language workspaces.

- `alpha.js`
  Exposes a shared `TraceLogger` with nested `net` and `cache` channels plus
  helper functions that emit trace and operational logs.
- `beta.js`
  Exposes a shared `TraceLogger` with `io`, `scheduler`, and
  `scheduler.tick` channels.
- `gamma.js`
  Exposes a shared `TraceLogger` with `physics` and `metrics` channels.

These modules are part of the demo contract. The executable demos and demo
tests depend on their exported trace namespaces and channel layout.
