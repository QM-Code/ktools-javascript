#!/usr/bin/env node
"use strict";

const path = require("node:path");

const { loadKcli } = require("../../../src/kcli/deps");
const { getInlineParser: getAlphaInlineParser } = require(path.join(__dirname, "..", "..", "sdk", "alpha"));
const { getInlineParser: getBetaInlineParser } = require(path.join(__dirname, "..", "..", "sdk", "beta"));
const { getInlineParser: getGammaInlineParser } = require(path.join(__dirname, "..", "..", "sdk", "gamma"));

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

function handleBuildProfile(context, value) {
    void context;
    void value;
}

function handleBuildClean(context) {
    void context;
}

function handleVerbose(context) {
    void context;
}

function handleOutput(context, value) {
    void context;
    void value;
}

function handleArgs(context) {
    void context;
}

function main(argv) {
    const tokens = Array.isArray(argv) ? Array.from(argv) : Array.from(process.argv);
    const exeName = executableName(tokens);

    const parser = new kcli.Parser();
    const alphaParser = getAlphaInlineParser();
    const betaParser = getBetaInlineParser();
    const gammaParser = getGammaInlineParser();
    gammaParser.setRoot("--newgamma");

    const buildParser = new kcli.InlineParser("--build");
    buildParser.setHandler("-profile", handleBuildProfile, "Set build profile.");
    buildParser.setHandler("-clean", handleBuildClean, "Enable clean build.");

    parser.addInlineParser(alphaParser);
    parser.addInlineParser(betaParser);
    parser.addInlineParser(gammaParser);
    parser.addInlineParser(buildParser);

    parser.addAlias("-v", "--verbose");
    parser.addAlias("-out", "--output");
    parser.addAlias("-a", "--alpha-enable");
    parser.addAlias("-b", "--build-profile");

    parser.setHandler("--verbose", handleVerbose, "Enable verbose app logging.");
    parser.setHandler("--output", handleOutput, "Set app output target.");
    parser.setPositionalHandler(handleArgs);
    parser.parseOrExit(tokens.length, tokens);

    console.log("\nUsage:");
    console.log(`  ${exeName} --<root>\n`);
    console.log("Enabled --<root> prefixes:");
    console.log("  --alpha");
    console.log("  --beta");
    console.log("  --newgamma (gamma override)\n");
    return 0;
}

if (require.main === module) {
    process.exitCode = main(process.argv);
}

module.exports = {
    main,
};
