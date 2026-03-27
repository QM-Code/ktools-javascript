# ktrace-javascript

Assume `../../ktools/AGENTS.md` and `../AGENTS.md` have already been read.

`ktools-javascript/ktrace/` is the JavaScript implementation of `ktrace`.

## Guidance For Agents

1. Preserve the cross-language tracing model and the `kcli` integration shape.
2. Keep selector behavior and demo ergonomics aligned with the C++ implementation where practical.
3. Use `kbuild` for builds and demo wrapper generation.
