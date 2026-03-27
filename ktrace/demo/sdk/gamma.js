"use strict";

const { loadPackage } = require("./common");

const ktrace = loadPackage(__filename, "ktrace");

function getTraceLogger() {
    if (!getTraceLogger._logger) {
        const trace = new ktrace.TraceLogger("gamma");
        trace.addChannel("physics", ktrace.Color("MediumOrchid1"));
        trace.addChannel("metrics", ktrace.Color("LightSkyBlue1"));
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
