#!/usr/bin/env node
"use strict";

const path = require("node:path");

const { loadKcli, loadPackage } = require("../../../src/ktrace/deps");
const alpha = require(path.join(__dirname, "..", "..", "sdk", "alpha"));

const kcli = loadKcli(__filename);
const ktrace = loadPackage(__filename, "ktrace");

function main(argv) {
    const tokens = Array.isArray(argv) ? Array.from(argv) : Array.from(process.argv);

    const logger = new ktrace.Logger();
    const trace = new ktrace.TraceLogger("core");
    trace.addChannel("app", ktrace.Color("BrightCyan"));
    trace.addChannel("startup", ktrace.Color("BrightYellow"));

    logger.addTraceLogger(trace);
    logger.addTraceLogger(alpha.getTraceLogger());

    logger.enableChannel(trace, ".app");
    trace.trace("app", "core initialized local trace channels");

    const parser = new kcli.Parser();
    parser.addInlineParser(logger.makeInlineParser(trace));
    parser.parseOrExit(tokens.length, tokens);

    trace.trace("app", "cli processing enabled, use --trace for options");
    trace.trace("startup", "testing imported tracing, use --trace '*.*' to view imported channels");
    alpha.testTraceLoggingChannels();
    return 0;
}

if (require.main === module) {
    process.exitCode = main(process.argv);
}

module.exports = {
    main,
};
