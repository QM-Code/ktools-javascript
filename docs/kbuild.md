# `kbuild` In `ktools-javascript`

The JavaScript workspace uses the shared `kbuild` command model for workspace
operations.

## Current Status

- the checked-out workspace does not currently contain a separate `kbuild/`
  implementation directory
- the expected entrypoint is the shared `kbuild` command on `PATH`
- build orchestration should remain compatible with the shared repo-level tool
