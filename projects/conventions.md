# JavaScript Conventions Refactor

## Mission

Refactor `ktools-javascript/` so that `kcli` and `ktrace` preserve the shared
ktools behavior while reading like intentional JavaScript modules rather than
C++ designs split across `.js` files.

This is a full audit and complete refactor brief for a fresh agent.

## Scope

This brief applies to:

- `ktools-javascript/kcli/`
- `ktools-javascript/ktrace/`
- `ktools-javascript/README.md`
- `ktools-javascript/projects/updates.md`

## Required Reading

- `../ktools/AGENTS.md`
- `AGENTS.md`
- `README.md`
- `projects/updates.md`
- `kcli/AGENTS.md`
- `kcli/README.md`
- `ktrace/AGENTS.md`
- `ktrace/README.md`
- local docs for `kcli` and `ktrace`
- the matching C++ docs and tests for the same behavior

## Core Principle

Preserve behavior, not C++-style module texture.

Preserve:

- CLI grammar
- alias and inline-root behavior
- trace selector behavior
- help/error behavior
- trace formatting behavior
- demo contract behavior

Do not preserve:

- class shapes that exist only because the C++ code had a type there
- module boundaries that obscure JS ownership
- setter-heavy public APIs where plain-object or direct module APIs are clearer
- “common” demo support layers that hide local ownership

## Assignment Model

A fresh agent should assume:

- both components need full API and internal review
- both CommonJS-facing modules and internal helpers are in scope
- existing `projects/updates.md` should be treated as current context
- completed items there should not be reopened without a concrete reason

## Public API Refactor Goals

Prefer JavaScript-native shapes:

- module exports that are obvious and narrow
- plain object config where that is simpler than setter/getter ceremony
- camelCase names that read naturally in JS
- helper functions or small classes only when they genuinely clarify usage
- no public transport vocabulary inherited from C++ if JS already has a native
  representation

`kcli` should read as a JavaScript parser package.

`ktrace` should read as a JavaScript tracing/logging package that happens to
compose with `kcli`.

## Internal Refactor Goals

Review and refactor:

- oversized internal modules
- utility modules with unclear ownership
- unnecessary object/class indirection
- duplicated code caused by preserving foreign structure
- state models that fight normal JavaScript usage

Prefer:

- small cohesive modules
- obvious public vs internal boundaries
- explicit demo ownership
- clarity over abstraction-heavy patterns

## Demo, Test, And Docs Expectations

- demos are contract material
- bootstrap, SDK, and executable demos must remain explicit
- do not reintroduce shared demo helper files
- docs must describe the current layout directly
- tests should map the important parity cases onto the actual module surface

## Validation

At minimum:

- `cd ktools-javascript/kcli && kbuild --build-latest`
- `cd ktools-javascript/kcli && kbuild --build-demos`
- `cd ktools-javascript/kcli && node --test tests/*.js demo/tests/*.js`
- `cd ktools-javascript/ktrace && kbuild --build-latest`
- `cd ktools-javascript/ktrace && kbuild --build-demos`
- `cd ktools-javascript/ktrace && node --test tests/*.js demo/tests/*.js`
- run the documented demo commands

## Done When

- a JavaScript reviewer would find the modules unsurprising
- public and internal module boundaries are obvious
- no major public API still feels like direct C++ transport
- demos remain explicit and self-contained
- docs/tests/layout all describe the same current structure
- validation passes

## Final Checklist

- read all required docs and `projects/updates.md`
- audit the public module surface
- refactor port-shaped APIs and internals toward JS norms
- keep demo ownership explicit
- update tests and docs
- validate the workspace
