# JavaScript kcli Project

## Mission

Bring `ktools-javascript/kcli/` up to the C++ reference standard while keeping
the implementation idiomatic for JavaScript and preserving the current
CommonJS-based API shape.

## Required Reading

- `../ktools/AGENTS.md`
- `AGENTS.md`
- `kcli/AGENTS.md`
- `kcli/README.md`
- `../ktools-cpp/kcli/README.md`
- `../ktools-cpp/kcli/docs/behavior.md`
- `../ktools-cpp/kcli/cmake/tests/kcli_api_cases.cpp`

## Current Gaps

- The source modules are already well split.
- The repo is less explicit than C++ about public vs internal modules.
- The demo SDK layout is flatter than the reference layout.
- Tracked build output exists under `kcli/build/latest` and demo build trees.
- The implementation needs a deliberate parity audit against the C++ contract.

## Work Plan

1. Make source boundaries clearer.
- Keep `api.js`, `model.js`, `normalize.js`, `process.js`, and related modules,
  but consider introducing a clearer distinction between public surface and
  internal-only modules.
- Do not add abstraction layers unless they improve readability.

2. Improve demo structure where it pays off.
- Review whether `demo/sdk/*.js` and `demo/exe/common.js` should be reorganized
  to mirror the reference layout more obviously.
- Preserve the current demo roles and names even if the file layout changes.

3. Tighten tests around the reference contract.
- Preserve the existing direct source tests and demo tests.
- Add tests for any C++-documented behavior that is still implicit in JS.
- Keep failures localized and readable.

4. Clean repo hygiene.
- Remove tracked build outputs from `build/latest` and `demo/**/build/latest`.
- If any staged SDK content must remain versioned, document why and keep it
  minimal.

5. Close behavior gaps.
- Match C++ semantics for error handling, bare inline roots, alias rewriting,
  value collection, and validation-before-handler execution.
- Keep the public usage style simple and close to the current `Parser` and
  `InlineParser` API.

## Constraints

- Preserve current user-facing API names unless a change is clearly justified.
- Keep the implementation easy to read without converting it into framework
  code.
- Stay aligned with the reference demos and behavior docs.

## Validation

- `cd ktools-javascript/kcli && kbuild --build-latest`
- `cd ktools-javascript/kcli && kbuild --build-demos`
- `cd ktools-javascript/kcli && node --test tests/*.js demo/tests/*.js`
- Run the demo commands listed in `ktools-javascript/kcli/README.md`

## Done When

- The module layout clearly communicates public vs internal responsibility.
- Demo and test structure make JS easy to compare to the C++ reference.
- Generated output no longer obscures the hand-written implementation.
