Internal implementation modules for `ktrace`.

Consumers should import [`src/ktrace`](./index.js) rather than reaching into
the sibling helper files in this directory.

The public CommonJS surface is:

- [`index.js`](./index.js) as the supported import entrypoint
- [`api.js`](./api.js) as the public API implementation backing that entrypoint

The remaining files here are internal helpers for selector parsing, formatting,
output, CLI integration, colors, and local dependency loading.
