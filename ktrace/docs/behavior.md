# Trace Behavior

This page captures the JavaScript `ktrace` behavior that matters in practice.

## Runtime Model

`ktrace` splits responsibilities between two public types:

- `TraceLogger` owns one namespace and its declared channels
- `Logger` owns the executable-facing registry, selector state, formatting, and
  final output

Channels only become selectable after their `TraceLogger` is attached through
`logger.addTraceLogger(...)`.

## Channel Enablement

Trace output from `trace.trace(...)` is emitted only when all of the following
are true:

- the `TraceLogger` is attached to a `Logger`
- the channel was registered with `addChannel(...)`
- the `Logger` currently has that qualified channel enabled

Operational logging from `info()`, `warn()`, and `error()` is always emitted
once the `TraceLogger` is attached.

## Selector Rules

Single-channel APIs accept:

- `.channel[.sub[.sub]]` for local-namespace lookups
- `namespace.channel[.sub[.sub]]` for explicit namespaces

Selector-list APIs accept comma-separated selector patterns including:

- `*.*`
- `*.*.*.*`
- `*.{net,io}`
- `{alpha,beta}.*`

Rules:

- leading-dot selectors resolve against the provided local namespace
- selector lists are matched only against channels already registered
- unmatched selectors emit a warning and do not fail the parse
- invalid selector syntax throws, which surfaces through `kcli` as a CLI error

## Formatting

Message formatting supports:

- sequential `{}` placeholders
- escaped braces `{{` and `}}`

It does not support fmt-style specifiers such as `{:x}`.

## Output Options

`Logger#setOutputOptions(...)` supports:

- `filenames`
- `line_numbers`
- `function_names`
- `timestamps`

If `function_names` is enabled, filenames and line numbers are enabled
automatically.

The `makeInlineParser(...)` helper exposes the corresponding CLI switches:

- `--trace-files`
- `--trace-functions`
- `--trace-timestamps`

## Color Names

`Color(name)` accepts the shared extended named palette used by the JavaScript
implementation and listed by `--trace-colors`.

Representative examples:

- `BrightCyan`
- `DeepSkyBlue1`
- `MediumSpringGreen`
- `Orange3`
- `MediumOrchid1`
- `LightSkyBlue1`

## Coverage

Current behavior is exercised by:

- `tests/test_ktrace_js.js`
- `demo/tests/test_core_trace_cli.js`
- `demo/tests/test_omega_trace_cli.js`
