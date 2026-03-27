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
