"use strict";

const path = require("node:path");
const { spawnSync } = require("node:child_process");

const repoRoot = path.resolve(__dirname, "..", "..", "..");

function runDemo(scriptRelativePath, ...args) {
    const scriptPath = path.join(repoRoot, scriptRelativePath);
    return spawnSync(process.execPath, [scriptPath, ...args], {
        cwd: repoRoot,
        encoding: "utf8",
    });
}

module.exports = {
    repoRoot,
    runDemo,
};
