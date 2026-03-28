# Karma CLI Parsing SDK (JavaScript)

`kcli` is the JavaScript implementation of the ktools CLI parsing SDK.
It is used by `ktrace`, and is designed around two common CLI shapes:

- top-level options such as `--verbose` and `--output`
- inline roots such as `--trace-*`, `--config-*`, and `--build-*`

The library gives you two explicit entrypoints:

- `parseOrExit(argc, argv)` for normal executable startup
- `parseOrThrow(argc, argv)` when the caller wants to intercept `CliError`

## Documentation

- [Overview and quick start](docs/index.md)
- [API reference](docs/api.md)
- [Parsing behavior](docs/behavior.md)
- [Examples](docs/examples.md)

## Quick Start

```js
"use strict";

const kcli = require("./src/kcli");

function handleVerbose(context) {
    void context;
}

function handleProfile(context, value) {
    void context;
    void value;
}

const parser = new kcli.Parser();
const build = new kcli.InlineParser("--build");

build.setHandler("-profile", handleProfile, "Set build profile.");

parser.addInlineParser(build);
parser.addAlias("-v", "--verbose");
parser.setHandler("--verbose", handleVerbose, "Enable verbose logging.");

parser.parseOrExit(process.argv.length, process.argv);
```

## Behavior Highlights

- The full command line is validated before any registered handler runs.
- `parseOrExit()` preserves the caller's `argv`, reports invalid CLI input to
  `stderr`, and exits with code `2`.
- `parseOrThrow()` preserves the caller's `argv` and throws `CliError`.
- Bare inline roots such as `--build` print inline help when no root value is
  provided.
- `setHandler(..., handler, ...)` treats a two-argument handler as a
  required-value option.
- `setOptionalValueHandler(...)` registers an optional-value option.
- Required values may consume a first token that begins with `-`.
- Literal `--` is rejected as an unknown option; it is not treated as an
  option terminator.

For the full parsing rules, see [docs/behavior.md](docs/behavior.md).

## Build SDK

```bash
kbuild --build-latest
```

SDK output:

- `build/latest/sdk/src/kcli`
- `build/latest/sdk/share/kbuild-javascript-sdk.json`

## Build And Run Demos

```bash
# Builds the SDK plus demos listed in .kbuild.json build.defaults.demos.
kbuild --build-latest

# Explicit demo-only run (uses build.demos when no args are provided).
kbuild --build-demos
```

Demo directories:

- Bootstrap load/use check: `demo/bootstrap/`
- SDK demos: `demo/sdk/`
- Executable demos: `demo/exe/{core,omega}`

Useful demo commands:

```bash
./demo/bootstrap/build/latest/bootstrap
./demo/exe/core/build/latest/test
./demo/exe/core/build/latest/test --alpha
./demo/exe/core/build/latest/test --alpha-message "hello"
./demo/exe/core/build/latest/test --output stdout
./demo/exe/omega/build/latest/test --beta-workers 8
./demo/exe/omega/build/latest/test --newgamma-tag "prod"
./demo/exe/omega/build/latest/test --build
```

## Repository Layout

- Public API: `src/kcli/`
- Source-level behavior coverage: `tests/test_kcli_js.js`
- Demo CLI coverage: `demo/tests/`
- Integration demos: `demo/`

## Build And Test

```bash
kbuild --build-latest
kbuild --build-demos
```

Direct source-level tests:

```bash
node --test tests/*.js demo/tests/*.js
```
