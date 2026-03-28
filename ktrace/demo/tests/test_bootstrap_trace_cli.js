"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { runDemo } = require("./support/utils");

test("bootstrap trace demo performs the minimal staged SDK check", () => {
    const result = runDemo("demo/bootstrap/main.js");
    assert.equal(result.status, 0);
    assert.match(result.stdout, /\[bootstrap\] \[bootstrap\] ktrace bootstrap staged-SDK check/);
    assert.match(result.stdout, /Bootstrap succeeded\./);
});
