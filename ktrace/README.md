# Karma Trace Logging SDK (JavaScript)

`ktrace` is the JavaScript implementation of the ktools tracing and logging SDK.

It provides:

- channel-based tracing through `TraceLogger.trace(...)`
- operational logging through `info()`, `warn()`, and `error()`
- runtime selector control through `Logger.enableChannels(...)`
- `kcli` integration through `Logger.makeInlineParser(...)`

## Documentation

- [API reference](docs/api.md)

## Build And Test

```bash
./kbuild.py --build-latest
./kbuild.py --build-demos
```

Direct source-level tests:

```bash
node --test tests/*.js demo/tests/*.js
```
