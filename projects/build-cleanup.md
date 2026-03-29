# JavaScript Build Cleanup Project

## Mission

Add a JavaScript-specific residual checker to `kbuild`, then verify that the
JavaScript workspace keeps generated output under `build/` instead of leaking
into the source tree.

This task spans both `ktools-javascript/` and the sibling shared build repo
`../kbuild/`.

## Required Reading

- `../ktools/AGENTS.md`
- `AGENTS.md`
- `README.md`
- `../kbuild/AGENTS.md`
- `../kbuild/README.md`
- `../kbuild/libs/kbuild/residual_ops.py`
- `../kbuild/libs/kbuild/backend_ops.py`
- `../kbuild/libs/kbuild/javascript_backend.py`
- `../kbuild/tests/test_java_residuals.py`
- `kcli/AGENTS.md`
- `kcli/README.md`
- `ktrace/AGENTS.md`
- `ktrace/README.md`

## Current Gaps

- `kbuild` does not yet have a JavaScript backend residual checker.
- The JavaScript backend is lighter-weight than compiled backends, so the
  checker needs to stay narrow and relevant to real generated output.
- The workspace should be verified so the build flow does not quietly drift
  into source-tree output over time.

## Work Plan

1. Add the JavaScript residual checker in `kbuild`.
- Follow the Java checker structure, but design a JavaScript-specific set of
  residuals.
- Target real generated artifacts that would indicate build/test leakage
  outside `build/`, not general project files.
- Keep the checker narrow, explicit, and easy to justify.

2. Add focused `kbuild` tests.
- Add tests for build refusal and `--git-sync` refusal when known JavaScript
  residuals appear outside `build/`.
- Add a positive case showing that staged output inside `build/` is allowed.

3. Audit the actual JavaScript workspace build flow.
- Build `kcli/` and `ktrace/` through normal `kbuild` entrypoints.
- Confirm the current build/test/demo flow does not write generated output
  outside `build/`.
- If it does, fix the build flow to keep that output staged properly.

4. Clean up real residuals if they exist.
- Remove any tracked or generated source-tree residuals that violate the new
  checker.
- Tighten ignore rules if needed, but prefer preventing the leak at the build
  step itself.

5. Keep docs aligned.
- Update `kbuild` or local docs only if they currently imply workflows that
  bypass the intended staged build layout.

## Constraints

- Do not invent a broad Node/JS junk-file policy unrelated to the actual build.
- Do not weaken the strict `kbuild` hygiene model.
- Prefer practical, current residuals over hypothetical ecosystem clutter.

## Validation

- Run the new JavaScript residual tests in `../kbuild`
- `cd ktools-javascript && kbuild --batch --build-latest`
- `cd ktools-javascript/kcli && kbuild --build-demos`
- `cd ktools-javascript/ktrace && kbuild --build-demos`
- Confirm the workspace stays free of generated JavaScript build residuals
  outside `build/`

## Done When

- `kbuild` rejects the relevant JavaScript residual class outside `build/`.
- The JavaScript workspace no longer leaks those artifacts in normal use.
- Workspace hygiene is enforced automatically instead of by habit alone.
