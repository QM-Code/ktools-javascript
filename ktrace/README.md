# Karma Trace Logging SDK (JavaScript)

Trace logging SDK with:

- namespaced channel tracing via `TraceLogger.trace(...)`
- always-visible operational logging via `TraceLogger.info/warn/error(...)`
- a library-facing `TraceLogger` source object
- an executable-facing `Logger` registry, filter, formatter, and CLI bridge

## Documentation

- [Overview and quick start](docs/index.md)
- [API reference](docs/api.md)
- [Trace behavior](docs/behavior.md)
- [Examples](docs/examples.md)

## Build SDK

```bash
kbuild --build-latest
```

SDK output:

- `build/latest/sdk/src/ktrace`
- `build/latest/sdk/share/kbuild-javascript-sdk.json`

Generated `build/latest/` trees are build artifacts and should not be tracked as
hand-written source.

## Build And Test Demos

```bash
# Builds SDK plus .kbuild.json "build.defaults.demos".
kbuild --build-latest

# Explicit demo-only run (uses build.demos when no args are provided).
kbuild --build-demos

./demo/exe/core/build/latest/test
```

Demos:

- Bootstrap load/use check: `demo/bootstrap/`
- SDK modules: `demo/sdk/{alpha,beta,gamma}.js`
- Executables: `demo/exe/{core,omega}`

Trace CLI examples:

```bash
./demo/bootstrap/build/latest/bootstrap
./demo/exe/core/build/latest/test --trace
./demo/exe/core/build/latest/test --trace '.*'
./demo/exe/omega/build/latest/test --trace '*.*'
./demo/exe/omega/build/latest/test --trace '*.*.*.*'
./demo/exe/omega/build/latest/test --trace '*.{net,io}'
./demo/exe/omega/build/latest/test --trace-namespaces
./demo/exe/omega/build/latest/test --trace-channels
./demo/exe/omega/build/latest/test --trace-colors
```

## API Model

`TraceLogger` is the namespace-bearing source object. Construct it with an
explicit namespace and declare channels on it:

```js
const trace = new ktrace.TraceLogger("alpha");
trace.addChannel("net", ktrace.color("DeepSkyBlue1"));
trace.addChannel("cache", ktrace.color("Gold3"));
```

SDKs should usually expose a shared logger from `getTraceLogger()`:

```js
function getTraceLogger() {
    if (!getTraceLogger._logger) {
        const trace = new ktrace.TraceLogger("alpha");
        trace.addChannel("net", ktrace.color("DeepSkyBlue1"));
        trace.addChannel("cache", ktrace.color("Gold3"));
        getTraceLogger._logger = trace;
    }
    return getTraceLogger._logger;
}
```

`Logger` is the executable-facing runtime. It imports one or more
`TraceLogger`s, maintains the central channel registry, and owns selector
filtering, formatting, and final output:

```js
const logger = new ktrace.Logger();

const appTrace = new ktrace.TraceLogger("core");
appTrace.addChannel("app", ktrace.color("BrightCyan"));
appTrace.addChannel("startup", ktrace.color("BrightYellow"));

logger.addTraceLogger(appTrace);
logger.addTraceLogger(alpha.getTraceLogger());
```

## Logging APIs

Channel-based trace output:

```js
trace.trace("channel", "message {}", value);
trace.traceChanged("channel", key, "message {}", value);
```

Always-visible operational logging:

```js
trace.info("message");
trace.warn("configuration file '{}' was not found", path);
trace.error("fatal startup failure");
```

Operational logging is independent of channel enablement. It is still
namespaced and uses the same formatting options as trace output.

Message formatting supports sequential `{}` placeholders and escaped braces
`{{` and `}}`.

Color names use the shared extended palette exposed by `--trace-colors`, which
now matches the JavaScript implementation's supported catalog.

## CLI Integration

The inline parser is logger-bound rather than global. Pass the executable's
local `TraceLogger` so leading-dot selectors resolve against the right
namespace:

```js
const logger = new ktrace.Logger();
const appTrace = new ktrace.TraceLogger("core");
appTrace.addChannel("app", ktrace.color("BrightCyan"));

logger.addTraceLogger(appTrace);

const parser = new kcli.Parser();
parser.addInlineParser(logger.makeInlineParser(appTrace));

parser.parseOrExit(process.argv);
```

## Channel Expression Forms

Single-selector APIs on `ktrace.Logger`:

- `.channel[.sub[.sub]]` for a local channel in the provided local namespace
- `namespace.channel[.sub[.sub]]` for an explicit namespace

List APIs on `ktrace.Logger`:

- `enableChannels(...)`
- `disableChannels(...)`
- list APIs accept selector patterns such as `*`, `{}`, and CSV
- list APIs resolve selectors against the channels currently registered at call
  time
- leading-dot selectors in list APIs resolve against the provided local
  namespace
- empty or whitespace-only selector lists are rejected
- unregistered channels remain disabled and do not emit, even if a selector
  pattern would otherwise match

Examples:

- `logger.enableChannel(appTrace, ".app");`
- `logger.enableChannel("alpha.net");`
- `logger.enableChannels("alpha.*,{beta,gamma}.net.*");`
- `logger.enableChannels(appTrace, ".net.*,otherapp.scheduler.tick");`
- `logger.disableChannels(appTrace, ".cache");`

Formatting options:

- `--trace-files`
- `--trace-functions`
- `--trace-timestamps`

These affect both `trace(...)` output and `info/warn/error(...)` output.

## Build And Test

```bash
kbuild --build-latest
kbuild --build-demos
```

Direct source-level tests:

```bash
node --test tests/*.js demo/tests/*.js
```

## Repository Layout

- Public import surface: `src/ktrace/index.js`
- Public API implementation: `src/ktrace/api.js`
- Internal helpers: `src/ktrace/{cli,colors,deps,format,output,selectors}.js`
- Source-level behavior coverage: `tests/test_ktrace_js.js`
- Demo CLI coverage: `demo/tests/`
