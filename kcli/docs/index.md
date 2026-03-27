# kcli JavaScript Overview

`kcli` is the JavaScript implementation of the ktools CLI parsing SDK.

It is designed around two common CLI shapes:

- top-level options such as `--verbose`
- inline roots such as `--trace-*`, `--config-*`, and `--build-*`

The implementation keeps the same core behavior model as the C++ repo while
using JavaScript calling conventions.

## Public Entry Points

- `parseOrExit(argc, argv)` for normal executable startup
- `parseOrThrow(argc, argv)` for callers that want to intercept `CliError`

## Quick Start

```js
"use strict";

const kcli = require("../src/kcli");

const parser = new kcli.Parser();
const build = new kcli.InlineParser("--build");

build.setHandler("-profile", (context, value) => {
    void context;
    console.log(`profile=${value}`);
}, "Set build profile.");

parser.addInlineParser(build);
parser.addAlias("-v", "--verbose");
parser.setHandler("--verbose", () => {
    console.log("verbose enabled");
}, "Enable verbose logging.");

parser.parseOrExit(process.argv.length, process.argv);
```

## What To Read Next

- [API reference](api.md)
- [Parsing behavior](behavior.md)
- [Examples](examples.md)

## Demo Programs

The demo wrappers built by `kbuild` are the quickest way to validate behavior:

```bash
kbuild --build-latest
./demo/exe/core/build/latest/test --alpha-message "hello"
./demo/exe/omega/build/latest/test --beta-workers 8
```
