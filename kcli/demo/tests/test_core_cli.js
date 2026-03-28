"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { runDemo } = require("./support/utils");

test("core demo rejects unknown alpha option", () => {
    const result = runDemo("demo/exe/core/main.js", "--alpha-d");
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /\[error\] \[cli\] unknown option --alpha-d/);
    assert.doesNotMatch(result.stdout, /KCLI js demo core import\/integration check passed/);
});

test("core demo accepts known alpha option", () => {
    const result = runDemo("demo/exe/core/main.js", "--alpha-message", "hello");
    assert.equal(result.status, 0);
    assert.match(result.stdout, /Processing --alpha-message with value "hello"/);
});

test("core demo preserves multi-value alpha payloads", () => {
    const result = runDemo("demo/exe/core/main.js", "--alpha-message", "hello", "world");
    assert.equal(result.status, 0);
    assert.match(result.stdout, /Processing --alpha-message with values \["hello","world"\]/);
});

test("core demo accepts alias-like required payloads", () => {
    const result = runDemo("demo/exe/core/main.js", "--alpha-message", "-a");
    assert.equal(result.status, 0);
    assert.match(result.stdout, /Processing --alpha-message with value "-a"/);
    assert.doesNotMatch(result.stdout, /Processing --alpha-enable/);
});

test("core demo optional inline value can be omitted", () => {
    const result = runDemo("demo/exe/core/main.js", "--alpha-enable");
    assert.equal(result.status, 0);
    assert.match(result.stdout, /Processing --alpha-enable/);
});

test("core demo alias option works", () => {
    const result = runDemo("demo/exe/core/main.js", "-a");
    assert.equal(result.status, 0);
    assert.match(result.stdout, /Processing --alpha-enable/);
});

test("core demo bare root prints help", () => {
    const result = runDemo("demo/exe/core/main.js", "--alpha");
    assert.equal(result.status, 0);
    assert.match(result.stdout, /Available --alpha-\* options:/);
    assert.match(result.stdout, /--alpha-enable \[value\]/);
});

test("core demo rejects unknown app option", () => {
    const result = runDemo("demo/exe/core/main.js", "--bogus");
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /\[error\] \[cli\] unknown option --bogus/);
});

test("core demo supports output alias", () => {
    const result = runDemo("demo/exe/core/main.js", "-out", "stdout");
    assert.equal(result.status, 0);
    assert.match(result.stdout, /KCLI js demo core import\/integration check passed/);
});

test("core demo treats double dash as unknown option", () => {
    const result = runDemo("demo/exe/core/main.js", "--", "--alpha-message", "hello");
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /\[error\] \[cli\] unknown option --/);
    assert.doesNotMatch(result.stdout, /KCLI js demo core import\/integration check passed/);
});
