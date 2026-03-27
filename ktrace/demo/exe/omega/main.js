#!/usr/bin/env node
"use strict";

const path = require("node:path");

const { loadPackage } = require(path.join(__dirname, "..", "..", "sdk", "common"));
const alpha = require(path.join(__dirname, "..", "..", "sdk", "alpha"));
const beta = require(path.join(__dirname, "..", "..", "sdk", "beta"));
const gamma = require(path.join(__dirname, "..", "..", "sdk", "gamma"));

const kcli = loadPackage(__filename, "kcli");
const ktrace = loadPackage(__filename, "ktrace");

function main(argv) {
    const tokens = Array.isArray(argv) ? Array.from(argv) : Array.from(process.argv);

    const logger = new ktrace.Logger();
    const trace = new ktrace.TraceLogger("omega");
    trace.addChannel("app", ktrace.Color("BrightCyan"));
    trace.addChannel("orchestrator", ktrace.Color("BrightYellow"));
    trace.addChannel("deep");
    trace.addChannel("deep.branch");
    trace.addChannel("deep.branch.leaf", ktrace.Color("LightSalmon1"));

    logger.addTraceLogger(trace);
    logger.addTraceLogger(alpha.getTraceLogger());
    logger.addTraceLogger(beta.getTraceLogger());
    logger.addTraceLogger(gamma.getTraceLogger());

    logger.enableChannel(trace, ".app");
    trace.trace("app", "omega initialized local trace channels");
    logger.disableChannel(trace, ".app");

    const parser = new kcli.Parser();
    parser.addInlineParser(logger.makeInlineParser(trace));
    parser.parseOrExit(tokens.length, tokens);

    trace.trace("app", "cli processing enabled, use --trace for options");
    trace.trace("app", "testing external tracing, use --trace '*.*' to view top-level channels");
    trace.trace("deep.branch.leaf", "omega trace test on channel 'deep.branch.leaf'");
    alpha.testTraceLoggingChannels();
    beta.testTraceLoggingChannels();
    gamma.testTraceLoggingChannels();
    alpha.testStandardLoggingChannels();
    trace.trace("orchestrator", "omega completed imported SDK trace checks");
    trace.info("testing...");
    trace.warn("testing...");
    trace.error("testing...");
    return 0;
}

if (require.main === module) {
    process.exitCode = main(process.argv);
}

module.exports = {
    main,
};
