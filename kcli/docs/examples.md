# Examples

This page shows a few common `kcli` patterns in JavaScript.

For complete runnable examples, also see:

- `demo/sdk/alpha.js`
- `demo/sdk/beta.js`
- `demo/sdk/gamma.js`
- `demo/exe/core/main.js`
- `demo/exe/omega/main.js`

## Minimal Executable

```js
const kcli = require("../src/kcli");

const parser = new kcli.Parser();

parser.addAlias("-v", "--verbose");
parser.setHandler("--verbose", () => {
    console.log("verbose enabled");
}, "Enable verbose logging.");

parser.parseOrExit(process.argv);
```

## Inline Root With Subcommands-Like Options

```js
const parser = new kcli.Parser();
const build = new kcli.InlineParser("--build");

build.setHandler("-profile", (context, value) => {
    void context;
    console.log(value);
}, "Set build profile.");

build.setHandler("-clean", (context) => {
    void context;
}, "Enable clean build.");

parser.addInlineParser(build);
parser.parseOrExit(process.argv);
```

This enables:

```text
--build
--build-profile release
--build-clean
```

## Bare Root Value Handler

```js
const config = new kcli.InlineParser("--config");

config.setRootValueHandler((context, value) => {
    void context;
    console.log(value);
}, "<assignment>", "Store a config assignment.");
```

This enables:

```text
--config
--config user=alice
```

Behavior:

- `--config` prints inline help
- `--config user=alice` invokes the root value handler

## Alias Preset Tokens

```js
const parser = new kcli.Parser();

parser.addAlias("-c", "--config-load", ["user-file"]);
parser.setHandler("--config-load", (context, value) => {
    console.log(context.option, value, context.valueTokens);
}, "Load config.");
```

This makes:

```text
-c settings.json
```

behave like:

```text
--config-load user-file settings.json
```

## Optional Values

```js
parser.setOptionalValueHandler("--color", (context, value) => {
    void context;
    console.log(value || "auto");
}, "Set or auto-detect color output.");
```

This enables both:

```text
--color
--color always
```

## Positionals

```js
parser.setPositionalHandler((context) => {
    for (const token of context.valueTokens) {
        console.log(token);
    }
});
```

## Custom Error Handling

If you want your own formatting or exit policy, use `parseOrThrow()`:

```js
try {
    parser.parseOrThrow(process.argv);
} catch (error) {
    if (error instanceof kcli.CliError) {
        console.error(`custom cli error: ${error.message}`);
        process.exitCode = 2;
    } else {
        throw error;
    }
}
```
