"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { runDemo } = require("./support/utils");

test("core bare trace root prints help", () => {
    const result = runDemo("demo/exe/core/main.js", "--trace");
    assert.equal(result.status, 0);
    assert.match(result.stdout, /Available --trace-\* options:/);
    assert.match(result.stdout, /--trace <channels>/);
});

test("core unknown trace option fails", () => {
    const result = runDemo("demo/exe/core/main.js", "--trace-f");
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /\[error\] \[cli\] unknown option --trace-f/);
});

test("core imported selector enables imported alpha channels", () => {
    const result = runDemo("demo/exe/core/main.js", "--trace", "*.*");
    assert.equal(result.status, 0);
    assert.match(result.stdout, /\[core\] \[app\] cli processing enabled, use --trace for options/);
    assert.match(result.stdout, /\[alpha\] \[net\] testing\.\.\./);
});

test("core timestamps option updates output format", () => {
    const result = runDemo("demo/exe/core/main.js", "--trace", ".app", "--trace-timestamps");
    assert.equal(result.status, 0);
    assert.match(result.stdout, /\[core\] \[[0-9]+\.[0-9]{6}\] \[app\] cli processing enabled, use --trace for options/);
});
