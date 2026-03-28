"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { runDemo } = require("./support/utils");

test("omega bare trace root prints help", () => {
    const result = runDemo("demo/exe/omega/main.js", "--trace");
    assert.equal(result.status, 0);
    assert.match(result.stdout, /Available --trace-\* options:/);
});

test("omega invalid selector fails through kcli", () => {
    const result = runDemo("demo/exe/omega/main.js", "--trace", "*");
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /\[error\] \[cli\] option '--trace': Invalid trace selector: '\* \(did you mean '\.\*'\?\)'/);
});

test("omega unmatched selector warns but does not fail", () => {
    const result = runDemo("demo/exe/omega/main.js", "--trace", ".missing");
    assert.equal(result.status, 0);
    assert.match(result.stdout, /\[omega\] \[warning\] enable ignored channel selector 'omega\.missing' because it matched no registered channels/);
});

test("omega trace examples prints the fuller selector guide", () => {
    const result = runDemo("demo/exe/omega/main.js", "--trace-examples");
    assert.equal(result.status, 0);
    assert.match(result.stdout, /General trace selector pattern:/);
    assert.match(result.stdout, /--trace '\*\.scheduler\.tick'/);
    assert.match(result.stdout, /--trace '\{alpha,beta\}\.net'/);
});

test("omega trace colors includes the shared extended palette", () => {
    const result = runDemo("demo/exe/omega/main.js", "--trace-colors");
    assert.equal(result.status, 0);
    assert.match(result.stdout, /Available trace colors:/);
    assert.match(result.stdout, /MediumSpringGreen/);
    assert.match(result.stdout, /MediumOrchid1/);
});

test("omega wildcard depth selector enables imported channels", () => {
    const result = runDemo("demo/exe/omega/main.js", "--trace", "*.*.*.*");
    assert.equal(result.status, 0);
    assert.match(result.stdout, /\[omega\] \[app\] cli processing enabled, use --trace for options/);
    assert.match(result.stdout, /omega trace test on channel 'deep\.branch\.leaf'/);
    assert.match(result.stdout, /\[alpha\] \[net\] testing\.\.\./);
    assert.match(result.stdout, /beta trace test on channel 'io'/);
    assert.match(result.stdout, /gamma trace test on channel 'physics'/);
});

test("omega brace selector narrows imported output", () => {
    const result = runDemo("demo/exe/omega/main.js", "--trace", "*.{net,io}");
    assert.equal(result.status, 0);
    assert.match(result.stdout, /\[alpha\] \[net\] testing\.\.\./);
    assert.match(result.stdout, /beta trace test on channel 'io'/);
    assert.doesNotMatch(result.stdout, /\[alpha\] \[cache\] testing\.\.\./);
    assert.doesNotMatch(result.stdout, /beta trace test on channel 'scheduler'/);
    assert.doesNotMatch(result.stdout, /gamma trace test on channel 'physics'/);
});
