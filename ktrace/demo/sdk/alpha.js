"use strict";

const { loadPackage } = require("../../src/ktrace/deps");

const ktrace = loadPackage(__filename, "ktrace");

function getTraceLogger() {
    if (!getTraceLogger._logger) {
        const trace = new ktrace.TraceLogger("alpha");
        trace.addChannel("net", ktrace.Color("DeepSkyBlue1"));
        trace.addChannel("net.alpha");
        trace.addChannel("net.beta");
        trace.addChannel("net.gamma");
        trace.addChannel("net.gamma.deep");
        trace.addChannel("cache", ktrace.Color("Gold3"));
        trace.addChannel("cache.gamma", ktrace.Color("Gold3"));
        trace.addChannel("cache.delta");
        trace.addChannel("cache.special", ktrace.Color("Red"));
        getTraceLogger._logger = trace;
    }
    return getTraceLogger._logger;
}

function testTraceLoggingChannels() {
    const trace = getTraceLogger();
    trace.trace("net", "testing...");
    trace.trace("net.alpha", "testing...");
    trace.trace("net.beta", "testing...");
    trace.trace("net.gamma", "testing...");
    trace.trace("net.gamma.deep", "testing...");
    trace.trace("cache", "testing...");
    trace.trace("cache.gamma", "testing...");
    trace.trace("cache.delta", "testing...");
    trace.trace("cache.special", "testing...");
}

function testStandardLoggingChannels() {
    const trace = getTraceLogger();
    trace.info("testing...");
    trace.warn("testing...");
    trace.error("testing...");
}

module.exports = {
    getTraceLogger,
    testStandardLoggingChannels,
    testTraceLoggingChannels,
};
