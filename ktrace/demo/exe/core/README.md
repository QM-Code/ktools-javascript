# Core Demo

Basic local-plus-imported tracing showcase for the JavaScript `ktrace` SDK and
the alpha demo SDK module.

This demo shows:

- executable-local tracing defined with a local `ktrace.TraceLogger`
- imported SDK tracing added via `alpha.getTraceLogger()`
- logger-managed selector state and output formatting
- local CLI integration through
  `parser.addInlineParser(logger.makeInlineParser(localTraceLogger))`
