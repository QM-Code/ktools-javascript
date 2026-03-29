# Omega Demo

Full-featured CLI integration showcase for the JavaScript `kcli` SDK plus the
demo SDK modules.

This demo exercises:

- multiple imported inline parsers: `--alpha-*`, `--beta-*`, and `--newgamma-*`
- executable-local inline parsing through `--build-*`
- root renaming via `gammaParser.setRoot("--newgamma")`
- executable-local usage/composition logic inside `main.js`
- aliases, positionals, and full-command-line validation before handler
  execution
