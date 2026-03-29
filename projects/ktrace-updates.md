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

- Staged build output is still tracked under `ktrace/build/latest` and demo
  build trees.
- `ktrace/demo/sdk/common.js` is shared demo code and should not exist.
- The demo SDK layout remains flatter than the reference layout and is harder
  to compare directly with the other languages.
- The parity audit against the full C++ contract should remain explicit, not
  inferred from passing tests alone.

## Work Plan

1. Decide and enforce the staged-output policy.
- Remove tracked build output if it does not need to be versioned.
- If some staged wrappers must remain, document that policy narrowly and keep
  the tracked set minimal.

2. Eliminate shared demo code.
- Remove `ktrace/demo/sdk/common.js`.
- Make `demo/sdk/alpha.js`, `demo/sdk/beta.js`, and `demo/sdk/gamma.js`
  self-contained.
- Keep bootstrap logic in `demo/bootstrap/`.
- Keep executable composition logic in `demo/exe/core/` and
  `demo/exe/omega/`.
- Do not replace `common.js` with another shared demo helper.

3. Continue the parity audit.
- Verify channel registration, selector parsing, unmatched-selector warnings,
  output options, operational logging, `traceChanged(...)`, and
  `makeInlineParser(...)` behavior against the C++ contract.
- Add focused tests for anything still covered only indirectly.

4. Keep the public/internal split explicit.
- Make sure `src/ktrace/api.js`, `src/ktrace/index.js`, and the internal
  helpers tell a clear story about what consumers should import.
- Tighten docs where that boundary still feels implicit.

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

- Build output no longer obscures the hand-written implementation, or any
  tracked staged output is explicitly justified.
- Shared demo code is gone.
- Behavior parity with C++ is obvious to reviewers.
