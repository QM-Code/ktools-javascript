# ktrace JavaScript Overview

`ktrace` is the JavaScript tracing and operational logging SDK in the ktools
stack.

It preserves the same runtime model used by the C++ implementation:

- library-owned `TraceLogger` instances define namespaces and channels
- executable-owned `Logger` instances aggregate those trace sources
- selector-based enablement decides which trace channels emit
- `info()`, `warn()`, and `error()` remain visible independent of selectors
- `kcli` integration exposes trace controls through `--trace-*`

## Quick Start

```js
"use strict";

const kcli = require("../src/kcli");
const ktrace = require("../src/ktrace");

const logger = new ktrace.Logger();
const trace = new ktrace.TraceLogger("core");

trace.addChannel("app", ktrace.color("BrightCyan"));
trace.addChannel("startup", ktrace.color("BrightYellow"));

logger.addTraceLogger(trace);
logger.enableChannel(trace, ".app");

const parser = new kcli.Parser();
parser.addInlineParser(logger.makeInlineParser(trace));
parser.parseOrExit(process.argv);

trace.trace("app", "cli initialized");
trace.info("service started");
```

## What To Read Next

- [API reference](api.md)
- [Trace behavior](behavior.md)
- [Examples](examples.md)

## Demo Programs

The built demo wrappers are the quickest parity check:

```bash
kbuild --build-latest
./demo/exe/core/build/latest/test --trace '.*'
./demo/exe/omega/build/latest/test --trace '*.{net,io}'
./demo/exe/omega/build/latest/test --trace-colors
```
