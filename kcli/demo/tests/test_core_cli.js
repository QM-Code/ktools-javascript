"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const repoRoot = path.resolve(__dirname, "..", "..");
const coreDemo = path.join(repoRoot, "demo", "exe", "core", "main.js");

function runDemo(...args) {
    return spawnSync(process.execPath, [coreDemo, ...args], {
        cwd: repoRoot,
        encoding: "utf8",
    });
}

test("core demo rejects unknown alpha option", () => {
    const result = runDemo("--alpha-d");
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /\[error\] \[cli\] unknown option --alpha-d/);
    assert.doesNotMatch(result.stdout, /KCLI js demo core import\/integration check passed/);
});

test("core demo accepts known alpha option", () => {
    const result = runDemo("--alpha-message", "hello");
    assert.equal(result.status, 0);
    assert.match(result.stdout, /Processing --alpha-message with value "hello"/);
});

test("core demo preserves multi-value alpha payloads", () => {
    const result = runDemo("--alpha-message", "hello", "world");
    assert.equal(result.status, 0);
    assert.match(result.stdout, /Processing --alpha-message with values \["hello","world"\]/);
});

test("core demo accepts alias-like required payloads", () => {
    const result = runDemo("--alpha-message", "-a");
    assert.equal(result.status, 0);
    assert.match(result.stdout, /Processing --alpha-message with value "-a"/);
    assert.doesNotMatch(result.stdout, /Processing --alpha-enable/);
});

test("core demo optional inline value can be omitted", () => {
    const result = runDemo("--alpha-enable");
    assert.equal(result.status, 0);
    assert.match(result.stdout, /Processing --alpha-enable/);
});

test("core demo alias option works", () => {
    const result = runDemo("-a");
    assert.equal(result.status, 0);
    assert.match(result.stdout, /Processing --alpha-enable/);
});

test("core demo bare root prints help", () => {
    const result = runDemo("--alpha");
    assert.equal(result.status, 0);
    assert.match(result.stdout, /Available --alpha-\* options:/);
    assert.match(result.stdout, /--alpha-enable \[value\]/);
});

test("core demo rejects unknown app option", () => {
    const result = runDemo("--bogus");
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /\[error\] \[cli\] unknown option --bogus/);
});

test("core demo supports output alias", () => {
    const result = runDemo("-out", "stdout");
    assert.equal(result.status, 0);
    assert.match(result.stdout, /KCLI js demo core import\/integration check passed/);
});

test("core demo treats double dash as unknown option", () => {
    const result = runDemo("--", "--alpha-message", "hello");
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /\[error\] \[cli\] unknown option --/);
    assert.doesNotMatch(result.stdout, /KCLI js demo core import\/integration check passed/);
});
