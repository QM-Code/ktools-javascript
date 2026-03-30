# ktrace JavaScript API

`ktrace` exposes three public exports:

- `TraceLogger`
- `Logger`
- `Color(name)`

## Import

From this component:

```js
const ktrace = require("../src/ktrace");
```

`src/ktrace/index.js` is the public CommonJS entrypoint. `src/ktrace/api.js`
backs that entrypoint. The sibling helper modules under `src/ktrace/` are
internal implementation files, even though the component's own tests may reference
`ktrace._internal` for focused behavior checks.

## `Color(name)`

Validates and returns a supported color token.

```js
const accent = ktrace.Color("BrightCyan");
```

`Color(name)` accepts the shared extended palette exposed by
`--trace-colors`. Representative examples include:

- `Default`
- `BrightCyan`
- `DeepSkyBlue1`
- `Gold3`
- `MediumSpringGreen`
- `Orange3`
- `MediumOrchid1`
- `LightSkyBlue1`

## `TraceLogger`

Namespace-bearing trace source used by libraries and applications.

### Constructor

```js
const trace = new ktrace.TraceLogger("alpha");
```

### Methods

#### `addChannel(channel, color = "Default")`

Registers a channel path inside the logger namespace.

```js
trace.addChannel("net", ktrace.Color("DeepSkyBlue1"));
trace.addChannel("cache");
trace.addChannel("cache.delta");
```

#### `getNamespace()`

Returns the logger namespace.

#### `shouldTraceChannel(channel)`

Returns whether the attached runtime currently enables the channel.

#### `trace(channel, formatText, ...args)`

Emits channel-based trace output if the channel is currently enabled.

```js
trace.trace("net", "connecting to {}", host);
```

#### `traceChanged(channel, key, formatText, ...args)`

Suppresses repeated output at one call site until `key` changes.

```js
trace.traceChanged("cache", revision, "cache revision {}", revision);
```

#### `info(formatText, ...args)`

Emits always-visible informational output.

#### `warn(formatText, ...args)`

Emits always-visible warning output.

#### `error(formatText, ...args)`

Emits always-visible error output.

Operational logging does not depend on channel enablement.

## `Logger`

Executable-facing runtime that aggregates trace loggers, applies selectors, and controls formatting.

### Constructor

```js
const logger = new ktrace.Logger();
```

### Methods

#### `addTraceLogger(traceLogger)`

Attaches a `TraceLogger` and imports its registered namespace/channels.

```js
logger.addTraceLogger(appTrace);
logger.addTraceLogger(alphaTrace);
```

#### `enableChannel(channel, localNamespace?)`

Enables one exact qualified channel, for example:

```js
logger.enableChannel("alpha.net");
logger.enableChannel(".app", "core");
logger.enableChannel(appTrace, ".app");
```

This exact-channel API does not accept wildcard, brace, or CSV selector syntax.
Use `enableChannels(...)` for selector lists.

#### `enableChannels(selectorsCsv, localNamespace?)`

Enables selector-based channel sets.

```js
logger.enableChannels("*.*");
logger.enableChannels("*.{net,io}");
logger.enableChannels(".app,*.{net,io}", "omega");
```

The `TraceLogger` overload is also supported:

```js
logger.enableChannels(appTrace, ".app");
```

#### `disableChannel(channel, localNamespace?)`

Disables one exact channel.

Like `enableChannel(...)`, this exact-channel API only accepts one concrete
channel expression.

#### `disableChannels(selectorsCsv, localNamespace?)`

Disables selector-based channel sets.

The `TraceLogger` overload is also supported:

```js
logger.disableChannels(appTrace, ".app");
```

#### `shouldTraceChannel(channel, localNamespace?)`

Returns whether a qualified or local channel is currently enabled.

```js
logger.shouldTraceChannel("alpha.net");
logger.shouldTraceChannel(".app", "core");
```

#### `setOutputOptions(options)`

Configures output formatting.

Supported fields:

- `filenames`
- `line_numbers`
- `function_names`
- `timestamps`

```js
logger.setOutputOptions({
    filenames: true,
    line_numbers: true,
    timestamps: true,
});
```

If `function_names` is enabled, filenames and line numbers are enabled automatically.

#### `getOutputOptions()`

Returns a copy of the current output options.

#### `getNamespaces()`

Returns all registered namespaces in sorted order.

#### `getChannels(traceNamespace)`

Returns all registered channels for one namespace in sorted order.

#### `makeInlineParser(localTraceLogger, traceRoot = "trace")`

Builds a `kcli.InlineParser` for trace CLI integration.

```js
const parser = new kcli.Parser();
parser.addInlineParser(logger.makeInlineParser(appTrace));
```

The generated inline parser supports:

- `--trace <selectors>`
- `--trace-examples`
- `--trace-namespaces`
- `--trace-channels`
- `--trace-colors`
- `--trace-files`
- `--trace-functions`
- `--trace-timestamps`

## Selector Forms

Supported selector patterns include:

- `.app`
- `alpha.net`
- `*.*`
- `*.*.*.*`
- `*.{net,io}`
- `{alpha,beta}.*`

Leading-dot selectors resolve against the local namespace supplied to the logger method or to `makeInlineParser()`.

Selectors only affect channels that were actually registered through `addTraceLogger()`.

## Formatting

`ktrace` uses sequential `{}` placeholders with escaped braces `{{` and `}}`.

```js
trace.info("loaded {} records from {{cache}}", count);
```

## Typical Pattern

```js
const kcli = require("../src/kcli");
const ktrace = require("../src/ktrace");

const logger = new ktrace.Logger();
const trace = new ktrace.TraceLogger("core");

trace.addChannel("app", ktrace.Color("BrightCyan"));
trace.addChannel("startup", ktrace.Color("BrightYellow"));

logger.addTraceLogger(trace);
logger.enableChannel(trace, ".app");

const parser = new kcli.Parser();
parser.addInlineParser(logger.makeInlineParser(trace));
parser.parseOrExit(process.argv.length, process.argv);

trace.trace("app", "cli initialized");
trace.info("service started");
```
