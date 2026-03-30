# JavaScript Kconfig Translation

## Mission

Create a new `ktools-javascript/kconfig/` component that matches the C++ `kconfig`
behavior while remaining native to JavaScript and Node.

Use the lessons from `kcli` and `ktrace`: keep the public API intentionally
JavaScript-shaped, keep the public/internal module boundary obvious, and do not
recreate a shared demo helper layer.

## Required Reading

- `../ktools/AGENTS.md`
- `AGENTS.md`
- `README.md`
- `kcli/AGENTS.md`
- `kcli/README.md`
- `ktrace/AGENTS.md`
- `ktrace/README.md`
- `projects/language-conventions.md`
- `../ktools-cpp/kconfig/README.md`
- `../ktools-cpp/kconfig/include/kconfig.hpp`
- `../ktools-cpp/kconfig/include/kconfig/json.hpp`
- `../ktools-cpp/kconfig/include/kconfig/asset.hpp`
- `../ktools-cpp/kconfig/include/kconfig/cli.hpp`
- `../ktools-cpp/kconfig/include/kconfig/store.hpp`
- `../ktools-cpp/kconfig/include/kconfig/store/fs.hpp`
- `../ktools-cpp/kconfig/include/kconfig/store/read.hpp`
- `../ktools-cpp/kconfig/include/kconfig/store/user.hpp`
- `../ktools-cpp/kconfig/cmake/tests/kconfig_json_api_test.cpp`
- `../ktools-cpp/kconfig/demo/bootstrap/README.md`
- `../ktools-cpp/kconfig/demo/sdk/alpha/README.md`
- `../ktools-cpp/kconfig/demo/sdk/beta/README.md`
- `../ktools-cpp/kconfig/demo/sdk/gamma/README.md`
- `../ktools-cpp/kconfig/demo/exe/core/README.md`
- `../ktools-cpp/kconfig/demo/exe/omega/README.md`
- `../ktools-cpp/kconfig/src/kconfig/cli.cpp`
- `../ktools-cpp/kconfig/src/kconfig/store/access.cpp`
- `../ktools-cpp/kconfig/src/kconfig/store/layers.cpp`
- `../ktools-cpp/kconfig/src/kconfig/store/read.cpp`
- `../ktools-cpp/kconfig/src/kconfig/store/bindings.cpp`

## Deliverables

- Add a new `kconfig/` component to the JavaScript workspace.
- Update workspace docs and `.kbuild.json` so `kconfig` participates in normal
  workspace builds after `kcli` and `ktrace`.
- Keep the public API native to JavaScript from the start.
- Make the public/internal module boundary explicit.

## Translation Scope

- JSON value model, parse, dump, and typed access.
- Store registry, mutability, merge, get, set, erase, and typed read helpers.
- Filesystem-backed store helpers, asset roots, and user-config flows.
- `kcli` inline parser integration for config overrides.
- `ktrace` integration for operator-facing warnings and errors.

## Demo Contract

- The demo tree must be:
  - `demo/bootstrap`
  - `demo/sdk/{alpha,beta,gamma}`
  - `demo/exe/{core,omega}`
- Do not introduce `demo/common`, `demo/sdk/common.js`, `demo/exe/common.js`,
  or any equivalent shared helper layer.
- Keep SDK demos self-contained and executable demos responsible for their own
  composition logic.

## JavaScript Rules

- Do not carry C/C++ calling conventions into the public API.
- Keep the CommonJS-facing entrypoint simple.
- Keep staged generated output narrowly justified and documented if it is
  genuinely needed.

## Validation

- `cd ktools-javascript/kconfig && kbuild --build-latest`
- `cd ktools-javascript/kconfig && kbuild --build-demos`
- `cd ktools-javascript/kconfig && node --test tests/*.js demo/tests/*.js`
- Run the demo commands documented in `ktools-javascript/kconfig/README.md`.

## Done When

- `ktools-javascript/kconfig/` exists as a normal workspace component.
- The public surface reads like JavaScript rather than a translated C++ API.
- Public and internal boundaries are obvious.
- Demo code is explicit and self-contained.
