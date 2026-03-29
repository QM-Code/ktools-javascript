# SDK Demo Modules

The `demo/sdk/` files are reusable inline-parser examples used by the
executable demos.

Each module is intentionally self-contained. There is no shared demo helper
layer under `demo/sdk/`.

- `alpha.js`
  Provides the `--alpha-*` inline parser used by the core and omega demos.
- `beta.js`
  Provides the `--beta-*` inline parser used by the omega demo.
- `gamma.js`
  Provides the `--gamma-*` inline parser that the omega demo renames to
  `--newgamma-*`.

These files are part of the demo contract, not throwaway examples. The demo
tests exercise them through the built wrappers under `demo/exe/*/build/latest/`.
