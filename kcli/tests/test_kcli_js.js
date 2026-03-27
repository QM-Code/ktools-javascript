"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const kcli = require("../src/kcli");

function captureStdout(fn) {
    let output = "";
    const originalWrite = process.stdout.write;
    process.stdout.write = function write(chunk, encoding, callback) {
        output += String(chunk);
        if (typeof encoding === "function") {
            encoding();
        } else if (typeof callback === "function") {
            callback();
        }
        return true;
    };
    try {
        fn();
    } finally {
        process.stdout.write = originalWrite;
    }
    return output;
}

function captureParseOrExitFailure(fn) {
    let stderr = "";
    const originalStderrWrite = process.stderr.write;
    const originalExit = process.exit;
    process.stderr.write = function write(chunk, encoding, callback) {
        stderr += String(chunk);
        if (typeof encoding === "function") {
            encoding();
        } else if (typeof callback === "function") {
            callback();
        }
        return true;
    };
    process.exit = function exit(code) {
        const error = new Error("process exit");
        error.exitCode = code;
        throw error;
    };
    try {
        fn();
        assert.fail("expected process.exit");
    } catch (error) {
        assert.equal(error.exitCode, 2);
    } finally {
        process.stderr.write = originalStderrWrite;
        process.exit = originalExit;
    }
    return stderr;
}

test("parser empty parse succeeds", () => {
    const argv = ["prog"];
    const parser = new kcli.Parser();
    parser.parseOrExit(argv.length, argv);
    assert.deepEqual(argv, ["prog"]);
});

test("known options with unknown option error defer handlers", () => {
    const argv = ["prog", "--verbose", "pos1", "--output", "stdout", "--bogus", "pos2"];
    let verbose = false;
    let output = "";
    let positionals = [];

    const parser = new kcli.Parser();
    parser.setHandler("verbose", () => {
        verbose = true;
    }, "Enable verbose logging.");
    parser.setHandler("output", (context, value) => {
        void context;
        output = value;
    }, "Set output target.");
    parser.setPositionalHandler((context) => {
        positionals = Array.from(context.value_tokens);
    });

    assert.throws(
        () => parser.parseOrThrow(argv.length, argv),
        (error) => {
            assert(error instanceof kcli.CliError);
            assert.equal(error.option(), "--bogus");
            assert.match(error.message, /unknown option --bogus/);
            return true;
        }
    );

    assert.equal(verbose, false);
    assert.equal(output, "");
    assert.deepEqual(positionals, []);
    assert.deepEqual(argv, ["prog", "--verbose", "pos1", "--output", "stdout", "--bogus", "pos2"]);
});

test("addAlias rewrites tokens without mutating argv", () => {
    const argv = ["prog", "-v", "tail"];
    let seenOption = "";
    const parser = new kcli.Parser();
    parser.addAlias("-v", "--verbose");
    parser.setHandler("--verbose", (context) => {
        seenOption = context.option;
    }, "Enable verbose logging.");

    parser.parseOrExit(argv.length, argv);
    assert.equal(seenOption, "--verbose");
    assert.deepEqual(argv, ["prog", "-v", "tail"]);
});

test("alias preset tokens append to value handlers", () => {
    const argv = ["prog", "-c", "settings.json"];
    let option = "";
    let value = "";
    let tokens = [];
    const parser = new kcli.Parser();
    parser.addAlias("-c", "--config-load", ["user-file"]);
    parser.setHandler("--config-load", (context, captured) => {
        option = context.option;
        value = captured;
        tokens = Array.from(context.value_tokens);
    }, "Load config.");

    parser.parseOrExit(argv.length, argv);
    assert.equal(option, "--config-load");
    assert.equal(value, "user-file settings.json");
    assert.deepEqual(tokens, ["user-file", "settings.json"]);
});

test("alias preset tokens satisfy required values", () => {
    const argv = ["prog", "-p"];
    let value = "";
    let tokens = [];
    const parser = new kcli.Parser();
    parser.addAlias("-p", "--profile", ["release"]);
    parser.setHandler("--profile", (context, captured) => {
        assert.equal(context.option, "--profile");
        value = captured;
        tokens = Array.from(context.value_tokens);
    }, "Set the active profile.");

    parser.parseOrExit(argv.length, argv);
    assert.equal(value, "release");
    assert.deepEqual(tokens, ["release"]);
});

test("alias preset tokens apply to inline root values", () => {
    const argv = ["prog", "-c"];
    let handled = false;
    let value = "";
    let tokens = [];
    const parser = new kcli.Parser();
    const config = new kcli.InlineParser("--config");
    config.setRootValueHandler((context, captured) => {
        handled = true;
        assert.equal(context.option, "--config");
        value = captured;
        tokens = Array.from(context.value_tokens);
    }, "<assignment>", "Store a config assignment.");
    parser.addInlineParser(config);
    parser.addAlias("-c", "--config", ["user-file=/tmp/user.json"]);

    parser.parseOrExit(argv.length, argv);
    assert.equal(handled, true);
    assert.equal(value, "user-file=/tmp/user.json");
    assert.deepEqual(tokens, ["user-file=/tmp/user.json"]);
});

test("parser can be reused across parses", () => {
    const parser = new kcli.Parser();
    let calls = 0;
    parser.addAlias("-v", "--verbose");
    parser.setHandler("--verbose", () => {
        calls += 1;
    }, "Enable verbose logging.");

    const first = ["prog", "-v"];
    const second = ["prog", "-v"];
    parser.parseOrExit(first.length, first);
    parser.parseOrExit(second.length, second);

    assert.equal(calls, 2);
});

test("alias does not rewrite required value tokens", () => {
    const argv = ["prog", "--output", "-v"];
    let verbose = false;
    let output = "";
    const parser = new kcli.Parser();
    parser.addAlias("-v", "--verbose");
    parser.setHandler("--verbose", () => {
        verbose = true;
    }, "Enable verbose logging.");
    parser.setHandler("--output", (context, value) => {
        void context;
        output = value;
    }, "Set output target.");

    parser.parseOrExit(argv.length, argv);
    assert.equal(verbose, false);
    assert.equal(output, "-v");
});

test("alias rejects invalid configurations", () => {
    const parser = new kcli.Parser();
    assert.throws(() => parser.addAlias("--verbose", "--output"), /single-dash form/);
    assert.throws(() => parser.addAlias("-v", "--bad target"), /double-dash form/);
    assert.throws(() => parser.addAlias("-a", "-b"), /double-dash form/);
});

test("inline handler normalization accepts short and full forms", () => {
    const argv = ["prog", "--build-flag", "--build-value", "data"];
    let flag = false;
    let value = "";
    const parser = new kcli.Parser();
    const build = new kcli.InlineParser("build");
    build.setHandler("-flag", () => {
        flag = true;
    }, "Enable build flag.");
    build.setHandler("--build-value", (context, rawValue) => {
        void context;
        value = rawValue;
    }, "Set build value.");
    parser.addInlineParser(build);

    parser.parseOrExit(argv.length, argv);
    assert.equal(flag, true);
    assert.equal(value, "data");
});

test("inline bare root prints help", () => {
    const argv = ["prog", "--build"];
    const parser = new kcli.Parser();
    const build = new kcli.InlineParser("build");
    build.setHandler("-flag", (context) => {
        void context;
    }, "Enable build flag.");
    build.setHandler("-value", (context, value) => {
        void context;
        void value;
    }, "Set build value.");
    parser.addInlineParser(build);

    const output = captureStdout(() => parser.parseOrExit(argv.length, argv));
    assert.match(output, /Available --build-\* options:/);
    assert.match(output, /--build-flag/);
    assert.match(output, /--build-value <value>/);
});

test("inline root value handler joins tokens", () => {
    const argv = ["prog", "--build", "fast", "mode"];
    let receivedValue = "";
    let receivedTokens = [];
    let receivedOption = "";
    const parser = new kcli.Parser();
    const build = new kcli.InlineParser("build");
    build.setRootValueHandler((context, value) => {
        receivedValue = value;
        receivedTokens = Array.from(context.value_tokens);
        receivedOption = context.option;
    });
    parser.addInlineParser(build);

    parser.parseOrExit(argv.length, argv);
    assert.equal(receivedValue, "fast mode");
    assert.deepEqual(receivedTokens, ["fast", "mode"]);
    assert.equal(receivedOption, "--build");
});

test("optional value handler allows missing value", () => {
    const argv = ["prog", "--build-enable"];
    let called = false;
    let receivedValue = null;
    let receivedTokens = [];
    const parser = new kcli.Parser();
    const build = new kcli.InlineParser("build");
    build.setOptionalValueHandler("-enable", (context, value) => {
        called = true;
        receivedValue = value;
        receivedTokens = Array.from(context.value_tokens);
    }, "Enable build mode.");
    parser.addInlineParser(build);

    parser.parseOrExit(argv.length, argv);
    assert.equal(called, true);
    assert.equal(receivedValue, "");
    assert.deepEqual(receivedTokens, []);
});

test("required value handler accepts dash-prefixed first value", () => {
    const argv = ["prog", "--build-value", "-debug"];
    let value = "";
    const build = new kcli.InlineParser("build");
    build.setHandler("-value", (context, rawValue) => {
        void context;
        value = rawValue;
    }, "Set build value.");
    const parser = new kcli.Parser();
    parser.addInlineParser(build);

    parser.parseOrExit(argv.length, argv);
    assert.equal(value, "-debug");
});

test("positional handler preserves explicit empty tokens", () => {
    const argv = ["prog", "", "tail"];
    let positionals = [];
    const parser = new kcli.Parser();
    parser.setPositionalHandler((context) => {
        positionals = Array.from(context.value_tokens);
    });

    parser.parseOrExit(argv.length, argv);
    assert.deepEqual(positionals, ["", "tail"]);
});

test("unknown option throws CliError", () => {
    const argv = ["prog", "--bogus"];
    const parser = new kcli.Parser();
    assert.throws(
        () => parser.parseOrThrow(argv.length, argv),
        (error) => {
            assert(error instanceof kcli.CliError);
            assert.equal(error.option(), "--bogus");
            assert.match(error.message, /unknown option --bogus/);
            return true;
        }
    );
});

test("handler exceptions surface as CliError", () => {
    const argv = ["prog", "--verbose"];
    const parser = new kcli.Parser();
    parser.setHandler("--verbose", () => {
        throw new Error("option boom");
    }, "Enable verbose logging.");

    assert.throws(
        () => parser.parseOrThrow(argv.length, argv),
        (error) => {
            assert(error instanceof kcli.CliError);
            assert.equal(error.option(), "--verbose");
            assert.match(error.message, /option boom/);
            return true;
        }
    );
});

test("inline parser root override applies", () => {
    const argv = ["prog", "--newgamma-tag", "prod"];
    let tag = "";
    const parser = new kcli.Parser();
    const gamma = new kcli.InlineParser("--gamma");
    gamma.setHandler("-tag", (context, value) => {
        void context;
        tag = value;
    }, "Set gamma tag.");
    gamma.setRoot("--newgamma");
    parser.addInlineParser(gamma);

    parser.parseOrExit(argv.length, argv);
    assert.equal(tag, "prod");
});

test("duplicate inline root rejected", () => {
    const parser = new kcli.Parser();
    parser.addInlineParser(new kcli.InlineParser("--build"));
    assert.throws(() => parser.addInlineParser(new kcli.InlineParser("build")), /already registered/);
});

test("parseOrExit reports and exits", () => {
    const argv = ["prog", "--bogus"];
    const parser = new kcli.Parser();
    const stderr = captureParseOrExitFailure(() => {
        parser.parseOrExit(argv.length, argv);
    });
    assert.match(stderr, /\[error\] \[cli\] unknown option --bogus/);
});
