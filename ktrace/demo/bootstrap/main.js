#!/usr/bin/env node
"use strict";

const { loadPackage } = require("../../src/ktrace/deps");

const ktrace = loadPackage(__filename, "ktrace");

function main(argv) {
    void argv;

    const logger = new ktrace.Logger();
    const trace = new ktrace.TraceLogger("bootstrap");
    trace.addChannel("bootstrap", ktrace.color("BrightGreen"));
    logger.addTraceLogger(trace);
    logger.enableChannel(trace, ".bootstrap");
    trace.trace("bootstrap", "ktrace bootstrap staged-SDK check");

    console.log("Bootstrap succeeded.");
    return 0;
}

if (require.main === module) {
    process.exitCode = main(process.argv);
}

module.exports = {
    main,
};
