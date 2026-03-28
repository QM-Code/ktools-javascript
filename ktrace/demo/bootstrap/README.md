# Bootstrap Demo

Exists for CI and as the smallest staged-SDK usage reference for JavaScript
`ktrace`.

This demo shows the minimal executable-side setup:
- create a `ktrace.Logger`
- create a local `ktrace.TraceLogger("bootstrap")`
- add a channel
- `logger.addTraceLogger(...)`
- enable a local selector with `logger.enableChannel(traceLogger, ".bootstrap")`
- emit with `traceLogger.trace(...)`
