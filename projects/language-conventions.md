# JavaScript Language Conventions

## Mission

Refactor `ktools-javascript/` so the public `kcli` and `ktrace` surfaces feel
native to JavaScript instead of carrying obvious C/C++ calling conventions.

Preserve behavior and capability, but make the public API read like JavaScript
that was designed for JavaScript.

## Required Reading

- `../ktools/AGENTS.md`
- `AGENTS.md`
- `README.md`
- `kcli/AGENTS.md`
- `kcli/README.md`
- `kcli/src/kcli/api.js`
- `ktrace/AGENTS.md`
- `ktrace/README.md`
- `ktrace/src/ktrace/api.js`
- `../ktools-cpp/kcli/README.md`
- `../ktools-cpp/kcli/docs/behavior.md`
- `../ktools-cpp/kcli/cmake/tests/kcli_api_cases.cpp`
- `../ktools-cpp/ktrace/README.md`
- `../ktools-cpp/ktrace/include/ktrace.hpp`
- `../ktools-cpp/ktrace/src/ktrace/cli.cpp`

## Primary Goals

- Remove explicit `argc` from the public `kcli` parse entrypoints. JavaScript
  callers should pass `argv`, not `argc` plus `argv`.
- Revisit public helper naming that currently reads like translated C++ rather
  than native JavaScript, especially `Color(...)` and any other constructor-like
  or utility naming that does not fit the runtime model.
- Keep the CommonJS-facing surface simple and unsurprising for Node callers.
- Update docs, demos, and tests so they show the final JavaScript API directly.

## Scope

### `kcli`

- Refactor the public parse API to a JavaScript-native call shape.
- Audit whether any other public parser names are carrying unnecessary
  cross-language baggage.
- Keep the public/internal module boundary explicit while making the API more
  idiomatic.

### `ktrace`

- Audit the public logger and trace-source API for obvious non-JavaScript
  naming carryover.
- Revisit the capitalized `Color(...)` helper specifically.
- Update `ktrace` examples so the CLI integration uses the final JavaScript
  `kcli` surface instead of `argc`/`argv` translation patterns.

## Rules

- Do not keep a permanent duplicate public API just to preserve the old calling
  convention.
- Preserve CommonJS usability.
- Preserve behavior, validation rules, and demo topology.
- Keep parity with the C++ behavior contract even when the JavaScript call
  shape changes.

## Validation

- `cd ktools-javascript/kcli && node --test tests/*.js demo/tests/*.js`
- `cd ktools-javascript/ktrace && node --test tests/*.js demo/tests/*.js`
- Run the demo commands listed in each component README.

## Done When

- Public JavaScript examples no longer pass explicit `argc`.
- The public surface no longer looks like a direct C/C++ translation.
- `kcli` and `ktrace` docs, demos, and tests all use the same final API shape.
