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

function expectCliError(fn, option, pattern) {
    assert.throws(
        fn,
        (error) => {
            assert(error instanceof kcli.CliError);
            assert.equal(error.option(), option);
            assert.match(error.message, pattern);
            return true;
        }
    );
}

test("parser empty parse succeeds", () => {
    const argv = ["prog"];
    const parser = new kcli.Parser();
    parser.parseOrExit(argv);
    assert.deepEqual(argv, ["prog"]);
});

test("inline parser rejects invalid root", () => {
    assert.throws(
        () => new kcli.InlineParser("-build"),
        /must use '--root' or 'root'/
    );
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
        positionals = Array.from(context.valueTokens);
    });

    assert.throws(
        () => parser.parseOrThrow(argv),
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

    parser.parseOrExit(argv);
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
        tokens = Array.from(context.valueTokens);
    }, "Load config.");

    parser.parseOrExit(argv);
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
        tokens = Array.from(context.valueTokens);
    }, "Set the active profile.");

    parser.parseOrExit(argv);
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
        tokens = Array.from(context.valueTokens);
    }, "<assignment>", "Store a config assignment.");
    parser.addInlineParser(config);
    parser.addAlias("-c", "--config", ["user-file=/tmp/user.json"]);

    parser.parseOrExit(argv);
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
    parser.parseOrExit(first);
    parser.parseOrExit(second);

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

    parser.parseOrExit(argv);
    assert.equal(verbose, false);
    assert.equal(output, "-v");
});

test("alias rejects invalid configurations", () => {
    const parser = new kcli.Parser();
    assert.throws(() => parser.addAlias("--verbose", "--output"), /single-dash form/);
    assert.throws(() => parser.addAlias("-v", "--bad target"), /double-dash form/);
    assert.throws(() => parser.addAlias("-a", "-b"), /double-dash form/);
});

test("alias with preset values rejects flag targets at parse time", () => {
    const argv = ["prog", "-v"];
    const parser = new kcli.Parser();
    parser.addAlias("-v", "--verbose", ["unexpected"]);
    parser.setHandler("--verbose", () => {
    }, "Enable verbose logging.");

    expectCliError(
        () => parser.parseOrThrow(argv),
        "-v",
        /does not accept values/
    );
});

test("positional handler requires nonempty function", () => {
    const parser = new kcli.Parser();
    assert.throws(() => parser.setPositionalHandler(null), /must not be empty/);
});

test("top-level handler normalization rejects single-dash names", () => {
    const parser = new kcli.Parser();
    assert.throws(
        () => parser.setHandler("-verbose", () => {
        }, "Enable verbose logging."),
        /must use '--name' or 'name'/
    );
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

    parser.parseOrExit(argv);
    assert.equal(flag, true);
    assert.equal(value, "data");
});

test("inline handler normalization rejects wrong root", () => {
    const build = new kcli.InlineParser("--build");
    assert.throws(
        () => build.setHandler("--other-flag", () => {
        }, "Enable other flag."),
        /must use '-name' or '--build-name'/
    );
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

    const output = captureStdout(() => parser.parseOrExit(argv));
    assert.match(output, /Available --build-\* options:/);
    assert.match(output, /--build-flag/);
    assert.match(output, /--build-value <value>/);
});

test("inline root help includes root value row", () => {
    const argv = ["prog", "--build"];
    const parser = new kcli.Parser();
    const build = new kcli.InlineParser("build");
    build.setRootValueHandler((context, value) => {
        void context;
        void value;
    }, "<selector>", "Select build targets.");
    build.setHandler("-flag", (context) => {
        void context;
    }, "Enable build flag.");
    parser.addInlineParser(build);

    const output = captureStdout(() => parser.parseOrExit(argv));
    assert.match(output, /--build <selector>/);
    assert.match(output, /Select build targets\./);
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
        receivedTokens = Array.from(context.valueTokens);
        receivedOption = context.option;
    });
    parser.addInlineParser(build);

    parser.parseOrExit(argv);
    assert.equal(receivedValue, "fast mode");
    assert.deepEqual(receivedTokens, ["fast", "mode"]);
    assert.equal(receivedOption, "--build");
});

test("bare inline root prints help even with root value handler", () => {
    const argv = ["prog", "--build"];
    const parser = new kcli.Parser();
    const build = new kcli.InlineParser("build");
    build.setRootValueHandler((context, value) => {
        void context;
        void value;
    }, "<profile>", "Set build profile.");
    build.setHandler("-clean", (context) => {
        void context;
    }, "Enable clean build.");
    parser.addInlineParser(build);

    const output = captureStdout(() => parser.parseOrExit(argv));
    assert.match(output, /Available --build-\* options:/);
    assert.match(output, /--build <profile>/);
    assert.match(output, /--build-clean/);
});

test("inline root errors when no root value handler is registered", () => {
    const argv = ["prog", "--build", "fast"];
    const parser = new kcli.Parser();
    parser.addInlineParser(new kcli.InlineParser("build"));

    expectCliError(
        () => parser.parseOrThrow(argv),
        "--build",
        /unknown value for option '--build'/
    );
    assert.deepEqual(argv, ["prog", "--build", "fast"]);
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
        receivedTokens = Array.from(context.valueTokens);
    }, "Enable build mode.");
    parser.addInlineParser(build);

    parser.parseOrExit(argv);
    assert.equal(called, true);
    assert.equal(receivedValue, "");
    assert.deepEqual(receivedTokens, []);
});

test("optional value handler accepts explicit empty value", () => {
    const argv = ["prog", "--build-enable", ""];
    let receivedValue = null;
    let receivedTokens = [];
    const parser = new kcli.Parser();
    const build = new kcli.InlineParser("build");
    build.setOptionalValueHandler("-enable", (context, value) => {
        receivedValue = value;
        receivedTokens = Array.from(context.valueTokens);
    }, "Enable build mode.");
    parser.addInlineParser(build);

    parser.parseOrExit(argv);
    assert.equal(receivedValue, "");
    assert.deepEqual(receivedTokens, [""]);
    assert.deepEqual(argv, ["prog", "--build-enable", ""]);
});

test("flag handlers do not consume following positional tokens", () => {
    const argv = ["prog", "--build-meta", "data"];
    let called = false;
    let positionals = [];
    const parser = new kcli.Parser();
    const build = new kcli.InlineParser("build");
    build.setHandler("-meta", () => {
        called = true;
    }, "Record metadata.");
    parser.addInlineParser(build);
    parser.setPositionalHandler((context) => {
        positionals = Array.from(context.valueTokens);
    });

    parser.parseOrExit(argv);
    assert.equal(called, true);
    assert.deepEqual(positionals, ["data"]);
    assert.deepEqual(argv, ["prog", "--build-meta", "data"]);
});

test("required value handler rejects missing value", () => {
    const argv = ["prog", "--build-value"];
    const parser = new kcli.Parser();
    const build = new kcli.InlineParser("build");
    build.setHandler("-value", (context, value) => {
        void context;
        void value;
    }, "Set build value.");
    parser.addInlineParser(build);

    expectCliError(
        () => parser.parseOrThrow(argv),
        "--build-value",
        /requires a value/
    );
    assert.deepEqual(argv, ["prog", "--build-value"]);
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

    parser.parseOrExit(argv);
    assert.equal(value, "-debug");
});

test("required value handler preserves shell whitespace", () => {
    const argv = ["prog", "--name", " Joe "];
    let receivedValue = "";
    let receivedTokens = [];
    const parser = new kcli.Parser();
    parser.setHandler("--name", (context, value) => {
        receivedValue = value;
        receivedTokens = Array.from(context.valueTokens);
    }, "Set display name.");

    parser.parseOrExit(argv);
    assert.equal(receivedValue, " Joe ");
    assert.deepEqual(receivedTokens, [" Joe "]);
    assert.deepEqual(argv, ["prog", "--name", " Joe "]);
});

test("required value handler accepts explicit empty value", () => {
    const argv = ["prog", "--name", ""];
    let receivedValue = "sentinel";
    let receivedTokens = [];
    const parser = new kcli.Parser();
    parser.setHandler("--name", (context, value) => {
        receivedValue = value;
        receivedTokens = Array.from(context.valueTokens);
    }, "Set display name.");

    parser.parseOrExit(argv);
    assert.equal(receivedValue, "");
    assert.deepEqual(receivedTokens, [""]);
    assert.deepEqual(argv, ["prog", "--name", ""]);
});

test("positional handler preserves explicit empty tokens", () => {
    const argv = ["prog", "", "tail"];
    let positionals = [];
    const parser = new kcli.Parser();
    parser.setPositionalHandler((context) => {
        positionals = Array.from(context.valueTokens);
    });

    parser.parseOrExit(argv);
    assert.deepEqual(positionals, ["", "tail"]);
});

test("unknown inline option throws CliError", () => {
    const argv = ["prog", "--build-unknown"];
    const parser = new kcli.Parser();
    parser.addInlineParser(new kcli.InlineParser("build"));

    expectCliError(
        () => parser.parseOrThrow(argv),
        "--build-unknown",
        /unknown option --build-unknown/
    );
});

test("unknown option throws CliError", () => {
    const argv = ["prog", "--bogus"];
    const parser = new kcli.Parser();
    assert.throws(
        () => parser.parseOrThrow(argv),
        (error) => {
            assert(error instanceof kcli.CliError);
            assert.equal(error.option(), "--bogus");
            assert.match(error.message, /unknown option --bogus/);
            return true;
        }
    );
});

test("literal double dash is reported as an unknown option", () => {
    const parser = new kcli.Parser();
    expectCliError(
        () => parser.parseOrThrow(["prog", "--"]),
        "--",
        /unknown option --/
    );
});

test("literal double dash blocks later alias handling", () => {
    const argv = ["prog", "--", "-v"];
    const parser = new kcli.Parser();
    parser.addAlias("-v", "--verbose");
    parser.setHandler("--verbose", () => {
    }, "Enable verbose logging.");

    expectCliError(
        () => parser.parseOrThrow(argv),
        "--",
        /unknown option --/
    );
    assert.deepEqual(argv, ["prog", "--", "-v"]);
});

test("handler exceptions surface as CliError", () => {
    const argv = ["prog", "--verbose"];
    const parser = new kcli.Parser();
    parser.setHandler("--verbose", () => {
        throw new Error("option boom");
    }, "Enable verbose logging.");

    assert.throws(
        () => parser.parseOrThrow(argv),
        (error) => {
            assert(error instanceof kcli.CliError);
            assert.equal(error.option(), "--verbose");
            assert.match(error.message, /option boom/);
            return true;
        }
    );
});

test("positional handler exceptions surface as CliError", () => {
    const argv = ["prog", "tail"];
    const parser = new kcli.Parser();
    parser.setPositionalHandler(() => {
        throw new Error("positional boom");
    });

    expectCliError(
        () => parser.parseOrThrow(argv),
        "",
        /positional boom/
    );
});

test("single parse pass handles inline options, top-level options, and positionals", () => {
    const argv = ["prog", "tail", "--alpha-message", "hello", "--output", "stdout"];
    let alphaMessage = "";
    let output = "";
    let positionals = [];
    const parser = new kcli.Parser();
    const alpha = new kcli.InlineParser("alpha");
    alpha.setHandler("-message", (context, value) => {
        void context;
        alphaMessage = value;
    }, "Set alpha message.");
    parser.addInlineParser(alpha);
    parser.setHandler("--output", (context, value) => {
        void context;
        output = value;
    }, "Set output target.");
    parser.setPositionalHandler((context) => {
        positionals = Array.from(context.valueTokens);
    });

    parser.parseOrExit(argv);
    assert.equal(alphaMessage, "hello");
    assert.equal(output, "stdout");
    assert.deepEqual(positionals, ["tail"]);
    assert.deepEqual(argv, ["prog", "tail", "--alpha-message", "hello", "--output", "stdout"]);
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

    parser.parseOrExit(argv);
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
        parser.parseOrExit(argv);
    });
    assert.match(stderr, /\[error\] \[cli\] unknown option --bogus/);
});
