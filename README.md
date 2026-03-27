# ktools-javascript

`ktools-javascript/` is the JavaScript workspace for the broader ktools ecosystem.

It is the root entrypoint for JavaScript implementations of the ktools libraries.

## Current Contents

This workspace currently contains:

- `kcli/`
- `ktrace/`

## Build Model

This workspace uses the shared `kbuild` repo exposed on `PATH` as `kbuild`.

From the workspace root:

```bash
kbuild --batch --build-latest
kbuild --batch --clean-latest
```

Use the relevant child repo when building or testing a specific implementation:

```bash
cd ktrace
kbuild --build-latest
```

## Where To Go Next

For concrete JavaScript API and implementation details, use the docs in the relevant child repo.

Current implementations:

- [kcli](kcli)
- [ktrace](ktrace)
