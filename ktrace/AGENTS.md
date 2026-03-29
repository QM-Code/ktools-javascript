# ktrace-javascript

Assume `../../ktools/AGENTS.md` and `../AGENTS.md` have already been read.

`ktools-javascript/ktrace/` is the JavaScript implementation of `ktrace`.

## Guidance For Agents

1. Preserve the cross-language tracing model and the `kcli` integration shape.
2. Keep selector behavior and demo ergonomics aligned with the C++ implementation where practical.
3. Use `kbuild` for builds and demo wrapper generation.
4. After a coherent batch of changes in `ktools-javascript/ktrace/`, return to
   the `ktools-javascript/` workspace root and run
   `kbuild --git-sync "<message>"`.
