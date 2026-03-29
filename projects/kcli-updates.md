# JavaScript kcli Project

## Mission

Make `ktools-javascript/kcli/` explicit, parity-checked, and easy to compare
with the C++ reference while keeping the CommonJS-facing API simple.

## Required Reading

- `../ktools/AGENTS.md`
- `AGENTS.md`
- `kcli/AGENTS.md`
- `kcli/README.md`
- `../ktools-cpp/kcli/README.md`
- `../ktools-cpp/kcli/docs/behavior.md`
- `../ktools-cpp/kcli/cmake/tests/kcli_api_cases.cpp`

## Current Gaps

- Staged build output is still tracked under `kcli/build/latest` and demo build
  trees.
- The demo SDK layout remains flatter than the reference layout
  (`demo/sdk/*.js` plus shared files) and is harder to compare directly with
  the other languages.
- The public/internal boundary is clearer than before, but the repo should make
  that distinction even more obvious in docs and layout.
- The parity audit against the C++ contract should remain explicit, not
  inferred from passing tests alone.

## Work Plan

1. Decide and enforce the staged-output policy.
- Remove tracked build output if it does not need to be versioned.
- If some staged SDK/test wrappers must remain, document that policy narrowly
  and keep the tracked set minimal.

2. Revisit demo structure.
- Review whether `demo/sdk/*.js` and shared executable helpers should be
  rearranged to mirror the bootstrap/sdk/exe contract more obviously.
- Preserve the current demo roles and names even if the file layout changes.

3. Keep the public/internal split explicit.
- Make sure `src/kcli/api.js`, `src/kcli/index.js`, and `src/kcli/internal/`
  tell a clear story about what consumers should import.
- Tighten docs where the boundary still feels implicit.

4. Continue the parity audit.
- Verify help output, alias rewriting, inline roots, root value handling,
  optional/required value behavior, double-dash rejection, and
  validation-before-handlers against the C++ docs and case list.
- Add focused tests for anything still covered only indirectly.

5. Keep the implementation readable.
- Avoid abstraction layers that do not improve clarity.
- Keep the exported API shape stable unless a change is clearly justified.

## Constraints

- Preserve current user-facing API names unless there is a strong reason to
  change them.
- Keep the repo easy to compare with the reference demos and docs.
- Prefer explicitness over framework-heavy structure.

## Validation

- `cd ktools-javascript/kcli && kbuild --build-latest`
- `cd ktools-javascript/kcli && kbuild --build-demos`
- `cd ktools-javascript/kcli && node --test tests/*.js demo/tests/*.js`
- Run the demo commands listed in `ktools-javascript/kcli/README.md`

## Done When

- Build output no longer obscures the hand-written implementation, or any
  tracked staged output is explicitly justified.
- Demo structure is easy to compare with the other languages.
- Public/internal boundaries and behavior parity are obvious to reviewers.
