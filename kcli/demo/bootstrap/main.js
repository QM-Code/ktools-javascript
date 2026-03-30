#!/usr/bin/env node
"use strict";

const { loadKcli } = require("../../src/kcli/deps");

const kcli = loadKcli(__filename);

function main(argv) {
    const tokens = Array.isArray(argv) ? Array.from(argv) : Array.from(process.argv);
    const parser = new kcli.Parser();
    parser.parseOrExit(tokens);
    console.log("Bootstrap succeeded.");
    return 0;
}

if (require.main === module) {
    process.exitCode = main(process.argv);
}

module.exports = {
    main,
};
