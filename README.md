# ktools-javascript

`ktools-javascript/` is the JavaScript workspace for the broader ktools ecosystem.

It is the root entrypoint for JavaScript implementations of the ktools libraries.

## Current Contents

This workspace currently contains:

- `kbuild/`
- `kcli/`
- `ktrace/`

## Build Model

This workspace uses a JavaScript-local `kbuild` copy at [`kbuild/`](kbuild).

From the workspace root:

```bash
./kbuild.py --batch --build-latest
./kbuild.py --batch --clean-latest
```

Use the relevant child repo when building or testing a specific implementation:

```bash
cd ktrace
./kbuild.py --build-latest
```

## Where To Go Next

For concrete JavaScript API and implementation details, use the docs in the relevant child repo.

Current implementations:

- [kbuild](kbuild)
- [kcli](kcli)
- [ktrace](ktrace)
