"use strict";

const path = require("node:path");

function executableName(tokens) {
    const argv = Array.isArray(tokens) ? tokens : [];
    const program = String(argv[0] || "");
    const script = String(argv[1] || "");
    const programBase = path.basename(program);
    if (/^node(|js)?$/i.test(programBase) && script) {
        return path.basename(script);
    }
    return program ? path.basename(program) : "app";
}

module.exports = {
    executableName,
};
