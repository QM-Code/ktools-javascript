"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const ktrace = require("../src/ktrace");

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

test("format message supports placeholders and escaped braces", () => {
    assert.equal(ktrace._internal.formatMessage("value {} {}", 7, "done"), "value 7 done");
    assert.equal(ktrace._internal.formatMessage("escaped {{}}"), "escaped {}");
    assert.throws(() => ktrace._internal.formatMessage("value {} {}", 7), /not enough arguments/);
    assert.throws(() => ktrace._internal.formatMessage("{"), /unterminated/);
    assert.throws(() => ktrace._internal.formatMessage("{:x}", 7), /unsupported/);
});

test("color names include the shared extended palette", () => {
    assert.equal(ktrace.Color("MediumSpringGreen"), "MediumSpringGreen");
    assert.equal(ktrace.Color("Orange3"), "Orange3");
    assert.equal(ktrace.Color("MediumOrchid1"), "MediumOrchid1");
    assert.equal(ktrace.Color("LightSkyBlue1"), "LightSkyBlue1");
    assert.equal(ktrace.Color("default"), "default");
    assert.throws(() => ktrace.Color("NoSuchColor"), /unknown trace color/);
});

test("registered selectors only enable registered channels", () => {
    const logger = new ktrace.Logger();
    const trace = new ktrace.TraceLogger("tests");
    trace.addChannel("net");
    trace.addChannel("cache");
    trace.addChannel("store.requests");
    logger.addTraceLogger(trace);

    logger.enableChannels("tests.*.*");
    assert.equal(logger.shouldTraceChannel("tests.net"), true);
    assert.equal(logger.shouldTraceChannel("tests.store.requests"), true);
    assert.equal(logger.shouldTraceChannel("tests.missing"), false);
});

test("exact channel APIs ignore missing channels and reject selector syntax", () => {
    const logger = new ktrace.Logger();
    const trace = new ktrace.TraceLogger("tests");
    trace.addChannel("net");
    logger.addTraceLogger(trace);

    const output = captureStdout(() => {
        logger.enableChannel("tests.missing");
        logger.disableChannel("tests.missing");
    });
    assert.equal(output, "");
    assert.equal(logger.shouldTraceChannel("tests.missing"), false);
    assert.throws(() => logger.enableChannel("tests.*"), /invalid trace channel/);
    assert.throws(() => logger.disableChannel("*.net"), /invalid trace channel/);
});

test("explicit enable and disable semantics work", () => {
    const logger = new ktrace.Logger();
    const trace = new ktrace.TraceLogger("tests");
    trace.addChannel("net");
    trace.addChannel("cache");
    logger.addTraceLogger(trace);

    logger.enableChannels("tests.*");
    logger.disableChannels("tests.*");
    logger.enableChannel("tests.net");
    assert.equal(logger.shouldTraceChannel("tests.net"), true);
    assert.equal(logger.shouldTraceChannel("tests.cache"), false);
    logger.disableChannel("tests.net");
    assert.equal(logger.shouldTraceChannel("tests.net"), false);
});

test("trace logger overloads work for exact channel APIs", () => {
    const logger = new ktrace.Logger();
    const trace = new ktrace.TraceLogger("tests");
    trace.addChannel("net");
    trace.addChannel("cache");
    logger.addTraceLogger(trace);

    logger.enableChannel(trace, ".net");
    assert.equal(logger.shouldTraceChannel("tests.net"), true);
    assert.equal(logger.shouldTraceChannel("tests.cache"), false);

    logger.disableChannel(trace, ".net");
    assert.equal(logger.shouldTraceChannel("tests.net"), false);
});

test("trace logger overloads work for selector list APIs", () => {
    const logger = new ktrace.Logger();
    const trace = new ktrace.TraceLogger("tests");
    trace.addChannel("net");
    trace.addChannel("cache");
    logger.addTraceLogger(trace);

    logger.enableChannels(trace, ".net,.cache");
    assert.equal(logger.shouldTraceChannel("tests.net"), true);
    assert.equal(logger.shouldTraceChannel("tests.cache"), true);

    logger.disableChannels(trace, ".cache");
    assert.equal(logger.shouldTraceChannel("tests.net"), true);
    assert.equal(logger.shouldTraceChannel("tests.cache"), false);
});

test("trace logger merge semantics reject conflicting explicit colors", () => {
    const logger = new ktrace.Logger();

    const first = new ktrace.TraceLogger("tests");
    first.addChannel("net");
    logger.addTraceLogger(first);

    const duplicate = new ktrace.TraceLogger("tests");
    duplicate.addChannel("net");
    logger.addTraceLogger(duplicate);

    const explicitColor = new ktrace.TraceLogger("tests");
    explicitColor.addChannel("net", ktrace.Color("Gold3"));
    logger.addTraceLogger(explicitColor);

    const conflictingColor = new ktrace.TraceLogger("tests");
    conflictingColor.addChannel("net", ktrace.Color("Orange3"));
    assert.throws(() => logger.addTraceLogger(conflictingColor), /conflicting explicit trace color/);
});

test("traceChanged suppresses repeated keys at one call site", () => {
    const logger = new ktrace.Logger();
    const trace = new ktrace.TraceLogger("tests");
    trace.addChannel("changed");
    logger.addTraceLogger(trace);
    logger.enableChannel("tests.changed");

    function emitChanged(key) {
        trace.traceChanged("changed", key, "changed");
    }

    const output = captureStdout(() => {
        emitChanged("alpha");
        emitChanged("alpha");
        emitChanged("beta");
    });
    const lines = output.trim().split("\n").filter(Boolean);
    assert.equal(lines.length, 2);
    assert(lines.every((line) => line.endsWith(" changed")));
});

test("function output option implies file and line output", () => {
    const logger = new ktrace.Logger();
    logger.setOutputOptions({
        function_names: true,
    });

    assert.deepEqual(logger.getOutputOptions(), {
        filenames: true,
        line_numbers: true,
        function_names: true,
        timestamps: false,
    });
});

test("info warn and error are always visible once attached", () => {
    const logger = new ktrace.Logger();
    const trace = new ktrace.TraceLogger("tests");
    logger.addTraceLogger(trace);
    logger.setOutputOptions({
        filenames: true,
        line_numbers: true,
    });

    const output = captureStdout(() => {
        trace.info("info message");
        trace.warn("warn value {}", 7);
        trace.error("error message");
    });
    assert.match(output, /^\[tests\] \[info\] \[/m);
    assert.match(output, /\[tests\] \[warning\] \[/);
    assert.match(output, /\[tests\] \[error\] \[/);
    assert.match(output, /info message/);
    assert.match(output, /warn value 7/);
    assert.match(output, /error message/);
});
