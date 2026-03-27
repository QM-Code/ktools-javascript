"use strict";

const { loadPackage } = require("./common");

const ktrace = loadPackage(__filename, "ktrace");

function getTraceLogger() {
    if (!getTraceLogger._logger) {
        const trace = new ktrace.TraceLogger("beta");
        trace.addChannel("io");
        trace.addChannel("scheduler");
        trace.addChannel("scheduler.tick");
        getTraceLogger._logger = trace;
    }
    return getTraceLogger._logger;
}

function testTraceLoggingChannels() {
    const trace = getTraceLogger();
    trace.trace("io", "beta trace test on channel 'io'");
    trace.trace("scheduler", "beta trace test on channel 'scheduler'");
    trace.trace("scheduler.tick", "beta trace test on channel 'scheduler.tick'");
}

module.exports = {
    getTraceLogger,
    testTraceLoggingChannels,
};
