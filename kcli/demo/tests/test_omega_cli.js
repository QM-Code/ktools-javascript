"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { runDemo } = require("./support/utils");

test("omega demo rejects unknown alpha option", () => {
    const result = runDemo("demo/exe/omega/main.js", "--alpha-d");
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /\[error\] \[cli\] unknown option --alpha-d/);
});

test("omega demo rejects unknown beta option", () => {
    const result = runDemo("demo/exe/omega/main.js", "--beta-z");
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /\[error\] \[cli\] unknown option --beta-z/);
});

test("omega demo rejects unknown newgamma option", () => {
    const result = runDemo("demo/exe/omega/main.js", "--newgamma-wut");
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /\[error\] \[cli\] unknown option --newgamma-wut/);
});

test("omega demo accepts beta workers", () => {
    const result = runDemo("demo/exe/omega/main.js", "--beta-workers", "8");
    assert.equal(result.status, 0);
    assert.match(result.stdout, /Processing --beta-workers with value "8"/);
});

test("omega demo validates beta workers", () => {
    const result = runDemo("demo/exe/omega/main.js", "--beta-workers", "abc");
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /\[error\] \[cli\] option '--beta-workers': expected an integer/);
    assert.doesNotMatch(result.stdout, /Processing --beta-workers/);
});

test("omega demo accepts newgamma tag option", () => {
    const result = runDemo("demo/exe/omega/main.js", "--newgamma-tag", "prod");
    assert.equal(result.status, 0);
    assert.match(result.stdout, /Processing --newgamma-tag with value "prod"/);
});

test("omega demo bare newgamma root prints help", () => {
    const result = runDemo("demo/exe/omega/main.js", "--newgamma");
    assert.equal(result.status, 0);
    assert.match(result.stdout, /Available --newgamma-\* options:/);
    assert.match(result.stdout, /--newgamma-tag <value>/);
});

test("omega demo rejects partially-valid command lines", () => {
    const result = runDemo("demo/exe/omega/main.js", "--alpha-message", "hello", "--bogus");
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /\[error\] \[cli\] unknown option --bogus/);
    assert.doesNotMatch(result.stdout, /Processing --alpha-message with value "hello"/);
});

test("omega demo supports build alias", () => {
    const result = runDemo("demo/exe/omega/main.js", "-b", "debug");
    assert.equal(result.status, 0);
    assert.match(result.stdout, /Enabled --<root> prefixes:/);
});

test("omega demo supports positional args", () => {
    const result = runDemo("demo/exe/omega/main.js", "input-a", "input-b");
    assert.equal(result.status, 0);
    assert.match(result.stdout, /Enabled --<root> prefixes:/);
});

test("omega demo treats double dash as unknown option", () => {
    const result = runDemo("demo/exe/omega/main.js", "--", "--alpha-message", "hello");
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /\[error\] \[cli\] unknown option --/);
    assert.doesNotMatch(result.stdout, /Processing --alpha-message with value "hello"/);
});
