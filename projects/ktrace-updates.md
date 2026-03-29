# JavaScript ktrace Project

## Mission

Make `ktools-javascript/ktrace/` explicit, parity-checked, and easy to compare
with the C++ reference while keeping the CommonJS-facing API simple.

## Required Reading

- `../ktools/AGENTS.md`
- `AGENTS.md`
- `ktrace/AGENTS.md`
- `ktrace/README.md`
- `ktrace/docs/api.md`
- `ktrace/docs/behavior.md`
- `../ktools-cpp/ktrace/README.md`
- `../ktools-cpp/ktrace/include/ktrace.hpp`
- `../ktools-cpp/ktrace/src/ktrace/cli.cpp`
- `../ktools-cpp/ktrace/cmake/tests/ktrace_channel_semantics_test.cpp`
- `../ktools-cpp/ktrace/cmake/tests/ktrace_format_api_test.cpp`
- `../ktools-cpp/ktrace/cmake/tests/ktrace_log_api_test.cpp`

## Current Gaps

- The repo is much cleaner now, but the demo SDK layout remains flatter than
  the reference layout and is still harder to compare directly with the other
  languages.
- The public/internal boundary is clearer, but docs and layout should keep
  that distinction explicit.
- The parity audit against the full C++ contract should remain explicit, not
  inferred from passing tests alone.
- Any staged-output policy that remains should stay narrow and documented.

## Work Plan

1. Continue the parity audit.
- Verify channel registration, selector parsing, unmatched-selector warnings,
  output options, operational logging, `traceChanged(...)`, and
  `makeInlineParser(...)` behavior against the C++ contract.
- Add focused tests for anything still covered only indirectly.

2. Revisit demo topology only if it improves clarity.
- Review whether the current `demo/sdk/*.js` layout tells the “separate demo
  entities” story clearly enough.
- Preserve current names and behavior even if you make the structure more
  legible.

3. Keep the public/internal split explicit.
- Make sure `src/ktrace/api.js`, `src/ktrace/index.js`, and the internal
  helpers tell a clear story about what consumers should import.
- Tighten docs where that boundary still feels implicit.

4. Keep staged-output policy explicit.
- If any generated wrappers or staged files remain intentionally tracked,
  document that policy narrowly.
- Do not let build output drift back into the hand-written tree.

5. Keep the implementation readable.
- Avoid abstraction layers that do not improve clarity.
- Keep the exported API shape stable unless a change is clearly justified.

## Constraints

- Preserve current user-facing API names unless there is a strong reason to
  change them.
- Keep the repo easy to compare with the reference demos and docs.
- Prefer explicitness over framework-heavy structure.

## Validation

- `cd ktools-javascript/ktrace && kbuild --build-latest`
- `cd ktools-javascript/ktrace && kbuild --build-demos`
- `cd ktools-javascript/ktrace && node --test tests/*.js demo/tests/*.js`
- Run the demo commands listed in `ktools-javascript/ktrace/README.md`

## Done When

- Demo structure is easy to read as separate entities, even if it stays
  JavaScript-idiomatic.
- Any intentionally staged tracked output is explicitly justified.
- Behavior parity with C++ is obvious to reviewers.
