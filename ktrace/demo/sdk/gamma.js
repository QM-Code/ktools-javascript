"use strict";

const { loadPackage } = require("../../src/ktrace/deps");

const ktrace = loadPackage(__filename, "ktrace");

function getTraceLogger() {
    if (!getTraceLogger._logger) {
        const trace = new ktrace.TraceLogger("gamma");
        trace.addChannel("physics", ktrace.color("MediumOrchid1"));
        trace.addChannel("metrics", ktrace.color("LightSkyBlue1"));
        getTraceLogger._logger = trace;
    }
    return getTraceLogger._logger;
}

function testTraceLoggingChannels() {
    const trace = getTraceLogger();
    trace.trace("physics", "gamma trace test on channel 'physics'");
    trace.trace("metrics", "gamma trace test on channel 'metrics'");
}

module.exports = {
    getTraceLogger,
    testTraceLoggingChannels,
};
