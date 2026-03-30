#!/usr/bin/env node
"use strict";

const path = require("node:path");

const { loadKcli } = require("../../../src/kcli/deps");
const { getInlineParser } = require(path.join(__dirname, "..", "..", "sdk", "alpha"));

const kcli = loadKcli(__filename);

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

function handleVerbose(context) {
    void context;
}

function handleOutput(context, value) {
    void context;
    void value;
}

function main(argv) {
    const tokens = Array.isArray(argv) ? Array.from(argv) : Array.from(process.argv);
    const exeName = executableName(tokens);

    const parser = new kcli.Parser();
    parser.addInlineParser(getInlineParser());
    parser.addAlias("-v", "--verbose");
    parser.addAlias("-out", "--output");
    parser.addAlias("-a", "--alpha-enable");
    parser.setHandler("--verbose", handleVerbose, "Enable verbose app logging.");
    parser.setHandler("--output", handleOutput, "Set app output target.");
    parser.parseOrExit(tokens);

    console.log("\nKCLI js demo core import/integration check passed\n");
    console.log("Usage:");
    console.log(`  ${exeName} --alpha`);
    console.log(`  ${exeName} --output stdout\n`);
    console.log("Enabled inline roots:");
    console.log("  --alpha\n");
    return 0;
}

if (require.main === module) {
    process.exitCode = main(process.argv);
}

module.exports = {
    main,
};
