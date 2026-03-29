# kcli-javascript

Assume `../../ktools/AGENTS.md` and `../AGENTS.md` have already been read.

`ktools-javascript/kcli/` is the JavaScript implementation of `kcli`.

## Guidance For Agents

1. Preserve the cross-language `kcli` parsing model.
2. Keep demo behavior aligned with the C++ demos where practical.
3. Use `kbuild` for normal build and test flows.
4. After a coherent batch of changes in `ktools-javascript/kcli/`, return to
   the `ktools-javascript/` workspace root and run
   `kbuild --git-sync "<message>"`.
