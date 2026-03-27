# Examples

This page shows common JavaScript `ktrace` integration patterns.

For runnable examples, also see:

- `demo/sdk/alpha.js`
- `demo/sdk/beta.js`
- `demo/sdk/gamma.js`
- `demo/exe/core/main.js`
- `demo/exe/omega/main.js`

## Shared SDK Trace Source

```js
const ktrace = require("../src/ktrace");

function getTraceLogger() {
    if (!getTraceLogger._logger) {
        const trace = new ktrace.TraceLogger("alpha");
        trace.addChannel("net", ktrace.Color("DeepSkyBlue1"));
        trace.addChannel("cache", ktrace.Color("Gold3"));
        getTraceLogger._logger = trace;
    }
    return getTraceLogger._logger;
}
```

## Executable Logger With CLI Integration

```js
const kcli = require("../src/kcli");
const ktrace = require("../src/ktrace");
const alpha = require("../demo/sdk/alpha");

const logger = new ktrace.Logger();
const trace = new ktrace.TraceLogger("core");

trace.addChannel("app", ktrace.Color("BrightCyan"));
trace.addChannel("startup", ktrace.Color("BrightYellow"));

logger.addTraceLogger(trace);
logger.addTraceLogger(alpha.getTraceLogger());

const parser = new kcli.Parser();
parser.addInlineParser(logger.makeInlineParser(trace));
parser.parseOrExit(process.argv.length, process.argv);
```

## Selector Control

```js
logger.enableChannel(trace, ".app");
logger.enableChannels("*.{net,io}");
logger.disableChannels(trace, ".startup");
```

## Output Formatting

```js
logger.setOutputOptions({
    filenames: true,
    line_numbers: true,
    timestamps: true,
});
```

## Operational Logging

```js
trace.trace("app", "accepted {} requests", count);
trace.info("service started");
trace.warn("retrying {}", url);
trace.error("startup failed for {}", serviceName);
```
