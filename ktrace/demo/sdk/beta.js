"use strict";

const { loadPackage } = require("../../src/ktrace/deps");

const ktrace = loadPackage(__filename, "ktrace");

function getTraceLogger() {
    if (!getTraceLogger._logger) {
        const trace = new ktrace.TraceLogger("beta");
        trace.addChannel("io", ktrace.color("MediumSpringGreen"));
        trace.addChannel("scheduler", ktrace.color("Orange3"));
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
