# kcli JavaScript API

`kcli` exposes four public exports:

- `Parser`
- `InlineParser`
- `HandlerContext`
- `CliError`

## Import

From this component:

```js
const kcli = require("../src/kcli");
```

The supported public surface is the package entrypoint above. Files under
`src/kcli/internal/` are implementation details.

## `Parser`

Top-level parser for ordinary CLI options and positional handling.

### Constructor

```js
const parser = new kcli.Parser();
```

### Methods

#### `addAlias(alias, target, presetTokens = [])`

Registers a single-dash alias that rewrites to a double-dash target.

```js
parser.addAlias("-v", "--verbose");
parser.addAlias("-p", "--profile", ["release"]);
```

#### `setHandler(option, handler, description)`

Registers a flag or required-value handler.

- If `handler` accepts one argument, it is treated as a flag handler.
- If `handler` accepts two or more arguments, it is treated as a required-value handler.

```js
parser.setHandler("--verbose", (context) => {
    console.log(context.option);
}, "Enable verbose logging.");

parser.setHandler("--output", (context, value) => {
    console.log(value);
}, "Set output target.");
```

#### `setOptionalValueHandler(option, handler, description)`

Registers an option whose value may be omitted.

```js
parser.setOptionalValueHandler("--color", (context, value) => {
    console.log(value || "auto");
}, "Enable color output.");
```

#### `setPositionalHandler(handler)`

Registers a handler that receives all unconsumed positional tokens after validation.

```js
parser.setPositionalHandler((context) => {
    console.log(context.valueTokens);
});
```

#### `addInlineParser(parser)`

Adds an inline-root parser such as `--trace-*` or `--build-*`.

```js
const build = new kcli.InlineParser("--build");
parser.addInlineParser(build);
```

#### `parseOrThrow(argv)`

Validates the full command line and runs handlers. Throws `CliError` on CLI failures.

#### `parseOrExit(argv)`

Same behavior as `parseOrThrow`, but reports the CLI error to `stderr` and exits with code `2`.

## `InlineParser`

Inline parser for a namespaced root such as `--trace` or `--build`.

### Constructor

```js
const trace = new kcli.InlineParser("--trace");
```

The constructor accepts either `"trace"` or `"--trace"`.

### Methods

#### `setRoot(root)`

Overrides the parser root after construction.

```js
trace.setRoot("--newtrace");
```

#### `setRootValueHandler(handler, valuePlaceholder?, description?)`

Registers a handler for the bare root form, for example `--trace '*.*'`.

```js
trace.setRootValueHandler((context, value) => {
    console.log(value);
}, "<selectors>", "Trace selected channels.");
```

If help metadata is provided, both `valuePlaceholder` and `description` are required.

#### `setHandler(option, handler, description)`

Registers an inline flag or required-value handler.

```js
trace.setHandler("-namespaces", () => {
}, "Show initialized namespaces.");

trace.setHandler("-output", (context, value) => {
}, "Set trace output target.");
```

Options may use either the short inline form or the fully qualified form:

- `"-namespaces"`
- `"--trace-namespaces"`

#### `setOptionalValueHandler(option, handler, description)`

Registers an inline option whose value may be omitted.

```js
trace.setOptionalValueHandler("-enable", (context, value) => {
}, "Enable tracing.");
```

## `HandlerContext`

Context object passed to handlers.

### Properties

- `root`: inline root without the leading `--`, or `""` for top-level options
- `option`: the matched option token, such as `"--verbose"` or `"--trace-files"`
- `command`: normalized command name without leading dashes
- `valueTokens`: collected value tokens before joining

## `CliError`

Error thrown for CLI validation or handler failures.

### Methods

#### `option()`

Returns the option token that caused the failure when available.

```js
try {
    parser.parseOrThrow(argv);
} catch (error) {
    if (error instanceof kcli.CliError) {
        console.error(error.option(), error.message);
    }
}
```

## Behavior Notes

- The full CLI is validated before any registered handler runs.
- Required values may consume a first token that begins with `-`.
- Bare inline roots print inline help when no root value is provided.
- Alias rewrites do not mutate the caller's `argv`.
- Literal `--` is rejected as an unknown option.
