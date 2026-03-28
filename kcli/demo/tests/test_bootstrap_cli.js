"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { runDemo } = require("./support/utils");

test("bootstrap demo succeeds with an empty parser", () => {
    const result = runDemo("demo/bootstrap/main.js");
    assert.equal(result.status, 0);
    assert.match(result.stdout, /Bootstrap succeeded\./);
});
