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

test("core bare trace root prints help", () => {
    const result = runDemo("--trace");
    assert.equal(result.status, 0);
    assert.match(result.stdout, /Available --trace-\* options:/);
    assert.match(result.stdout, /--trace <channels>/);
});

test("core unknown trace option fails", () => {
    const result = runDemo("--trace-f");
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /\[error\] \[cli\] unknown option --trace-f/);
});

test("core imported selector enables imported alpha channels", () => {
    const result = runDemo("--trace", "*.*");
    assert.equal(result.status, 0);
    assert.match(result.stdout, /\[core\] \[app\] cli processing enabled, use --trace for options/);
    assert.match(result.stdout, /\[alpha\] \[net\] testing\.\.\./);
});

test("core timestamps option updates output format", () => {
    const result = runDemo("--trace", ".app", "--trace-timestamps");
    assert.equal(result.status, 0);
    assert.match(result.stdout, /\[core\] \[[0-9]+\.[0-9]{6}\] \[app\] cli processing enabled, use --trace for options/);
});
