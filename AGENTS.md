# ktools-javascript

Assume `../ktools/AGENTS.md` has already been read.

`ktools-javascript/` is the JavaScript workspace for the ktools ecosystem.

## What This Level Owns

This workspace owns JavaScript-specific concerns such as:

- package/module layout
- JavaScript build and test flow
- JavaScript-specific API naming and integration patterns
- coordination across JavaScript tool implementations when more than one repo is present

Cross-language conceptual definitions belong at the overview/spec level, not here.

## Current Scope

This workspace currently contains:

- `kbuild/`
- `kcli/`
- `ktrace/`

## Guidance For Agents

1. First determine whether the task belongs at the workspace root or inside a specific implementation repo.
2. Prefer making changes in the narrowest repo that actually owns the behavior.
3. Use the root workspace only for JavaScript-workspace-wide concerns such as root docs or cross-repo coordination.
4. Read the relevant child repo `AGENTS.md` and `README.md` files before changing code in that repo.
5. Use the local JavaScript `kbuild.py` when working in this workspace; it is a language-local copy intended to preserve the shared operator flow.
