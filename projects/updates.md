# JavaScript Updates

## Mission

Keep `ktools-javascript/` explicit, parity-checked, and easy to compare with
the C++ reference while keeping the CommonJS-facing APIs simple.

## Required Reading

- `../ktools/AGENTS.md`
- `AGENTS.md`
- `README.md`
- `kcli/AGENTS.md`
- `kcli/README.md`
- `ktrace/AGENTS.md`
- `ktrace/README.md`
- `ktrace/docs/api.md`
- `ktrace/docs/behavior.md`
- `../ktools-cpp/kcli/README.md`
- `../ktools-cpp/kcli/docs/behavior.md`
- `../ktools-cpp/kcli/cmake/tests/kcli_api_cases.cpp`
- `../ktools-cpp/ktrace/README.md`
- `../ktools-cpp/ktrace/include/ktrace.hpp`
- `../ktools-cpp/ktrace/src/ktrace/cli.cpp`
- `../ktools-cpp/ktrace/cmake/tests/ktrace_channel_semantics_test.cpp`
- `../ktools-cpp/ktrace/cmake/tests/ktrace_format_api_test.cpp`
- `../ktools-cpp/ktrace/cmake/tests/ktrace_log_api_test.cpp`

## kcli Focus

- Keep the public and internal module boundary obvious in both layout and docs.
- Revisit the demo layout only if it makes the bootstrap, SDK, and executable
  entity story easier to read without fighting JavaScript’s idioms.
- Re-audit parser parity with C++ for help output, aliases, inline roots, root
  value handling, optional and required values, double-dash rejection, and
  validation-before-handlers.

## ktrace Focus

- Keep the public and internal module boundary obvious in both layout and docs.
- Revisit the demo layout only if it makes the separate demo-entity story
  clearer.
- Re-audit selector parsing, unmatched-selector warnings, output options,
  operational logging, `traceChanged(...)`, and `makeInlineParser(...)`
  behavior against the C++ contract.

## Cross-Cutting Rules

- Do not reintroduce shared demo helper files.
- Keep any intentionally staged generated files narrowly justified and
  documented.
- Prefer clarity over abstraction-heavy module patterns.

## Validation

- `cd ktools-javascript/kcli && kbuild --build-latest`
- `cd ktools-javascript/kcli && kbuild --build-demos`
- `cd ktools-javascript/kcli && node --test tests/*.js demo/tests/*.js`
- `cd ktools-javascript/ktrace && kbuild --build-latest`
- `cd ktools-javascript/ktrace && kbuild --build-demos`
- `cd ktools-javascript/ktrace && node --test tests/*.js demo/tests/*.js`
- Run the demo commands listed in each repo README

## Done When

- `kcli` and `ktrace` are both explicit and easy to compare with C++.
- Demo structure reads as separate entities, even if it stays
  JavaScript-idiomatic.
- Public and internal boundaries are obvious to reviewers.
