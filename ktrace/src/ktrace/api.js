"use strict";

// Public API surface for `require("./src/ktrace")`. Sibling modules implement
// internal helpers and are not part of the user-facing import contract.
const { COLOR_NAMES } = require("./colors");
const { createTraceInlineParser } = require("./cli");
const { formatMessage } = require("./format");
const {
    buildPrefix,
    captureSite,
    cloneOutputOptions,
    createOutputOptions,
    writeLine,
} = require("./output");
const {
    isIdentifier,
    isValidChannelPath,
    parseQualifiedChannel,
    parseSelectorList,
    selectorMatchesQualifiedChannel,
    trimWhitespace,
} = require("./selectors");

function color(colorName) {
    const token = trimWhitespace(colorName);
    if (!token) {
        throw new Error("trace color name must not be empty");
    }
    if (!COLOR_NAMES.includes(token) && token.toLowerCase() !== "default") {
        throw new Error(`unknown trace color '${token}'`);
    }
    return token;
}

function validateNamespaceOrThrow(traceNamespace) {
    const token = trimWhitespace(traceNamespace);
    if (!isIdentifier(token)) {
        throw new Error(`invalid trace namespace '${token}'`);
    }
    return token;
}

function validateChannelOrThrow(channel) {
    const token = trimWhitespace(channel);
    if (!isValidChannelPath(token)) {
        throw new Error(`invalid trace channel '${token}'`);
    }
    return token;
}

function createTraceLoggerData(traceNamespace) {
    return {
        traceNamespace: validateNamespaceOrThrow(traceNamespace),
        channels: new Map(),
        attachedLogger: null,
        changedKeys: new Map(),
    };
}

class TraceLogger {
    constructor(traceNamespace, sharedData) {
        this._data = sharedData || createTraceLoggerData(traceNamespace);
    }

    addChannel(channel, colorName = "Default") {
        const channelName = validateChannelOrThrow(channel);
        const normalizedColor = color(colorName);
        const existing = this._data.channels.get(channelName);
        if (existing && existing !== "Default" && normalizedColor !== "Default" && existing !== normalizedColor) {
            throw new Error(`conflicting explicit trace color for '${this._data.traceNamespace}.${channelName}'`);
        }
        this._data.channels.set(channelName, normalizedColor);
        if (this._data.attachedLogger) {
            this._data.attachedLogger._registerTraceLoggerData(this._data);
        }
    }

    getNamespace() {
        return this._data.traceNamespace;
    }

    shouldTraceChannel(channel) {
        const logger = this._data.attachedLogger;
        if (!logger) {
            return false;
        }
        try {
            return logger.shouldTraceChannel(`${this.getNamespace()}.${validateChannelOrThrow(channel)}`);
        } catch (error) {
            return false;
        }
    }

    trace(channel, formatText, ...args) {
        const channelName = validateChannelOrThrow(channel);
        const logger = this._data.attachedLogger;
        if (!logger) {
            return;
        }
        if (!logger._enabledChannels.has(`${this.getNamespace()}.${channelName}`)) {
            return;
        }
        const site = captureSite();
        const message = formatMessage(formatText, ...args);
        writeLine(buildPrefix(logger, this.getNamespace(), channelName, site), message);
    }

    traceChanged(channel, key, formatText, ...args) {
        const channelName = validateChannelOrThrow(channel);
        const site = captureSite();
        const siteKey = `${channelName}:${site.file}:${site.line}:${site.column}`;
        const normalizedKey = String(key);
        if (this._data.changedKeys.get(siteKey) === normalizedKey) {
            return;
        }
        this._data.changedKeys.set(siteKey, normalizedKey);
        this.trace(channelName, formatText, ...args);
    }

    info(formatText, ...args) {
        this._logSeverity("info", formatText, ...args);
    }

    warn(formatText, ...args) {
        this._logSeverity("warning", formatText, ...args);
    }

    error(formatText, ...args) {
        this._logSeverity("error", formatText, ...args);
    }

    _logSeverity(severity, formatText, ...args) {
        const logger = this._data.attachedLogger;
        if (!logger) {
            return;
        }
        const site = captureSite();
        const message = formatMessage(formatText, ...args);
        writeLine(buildPrefix(logger, this.getNamespace(), severity, site), message);
    }
}

class Logger {
    constructor() {
        this._outputOptions = createOutputOptions();
        this._traceLoggers = new Map();
        this._registeredChannels = new Map();
        this._enabledChannels = new Set();
    }

    _registerTraceLoggerData(traceLoggerData) {
        const namespaceName = traceLoggerData.traceNamespace;
        let namespaceMap = this._registeredChannels.get(namespaceName);
        if (!namespaceMap) {
            namespaceMap = new Map();
            this._registeredChannels.set(namespaceName, namespaceMap);
        }
        for (const [channelName, colorName] of traceLoggerData.channels.entries()) {
            const existing = namespaceMap.get(channelName);
            if (existing && existing !== "Default" && colorName !== "Default" && existing !== colorName) {
                throw new Error(`conflicting explicit trace color for '${namespaceName}.${channelName}'`);
            }
            namespaceMap.set(channelName, colorName);
        }
    }

    addTraceLogger(traceLogger) {
        if (!(traceLogger instanceof TraceLogger)) {
            throw new Error("ktrace logger expects a TraceLogger instance");
        }
        this._registerTraceLoggerData(traceLogger._data);
        traceLogger._data.attachedLogger = this;
        this._traceLoggers.set(traceLogger.getNamespace(), traceLogger._data);
    }

    _emitSelectorWarning(localNamespace, action, selectorDisplay) {
        const namespaceName = trimWhitespace(localNamespace) || "ktrace";
        const site = captureSite();
        const prefix = buildPrefix(this, namespaceName, "warning", site);
        writeLine(prefix, `${action} ignored channel selector '${selectorDisplay}' because it matched no registered channels`);
    }

    _hasRegisteredChannel(qualifiedChannel) {
        const dotIndex = qualifiedChannel.indexOf(".");
        if (dotIndex < 0) {
            return false;
        }
        const namespaceName = qualifiedChannel.slice(0, dotIndex);
        const channelName = qualifiedChannel.slice(dotIndex + 1);
        const namespaceMap = this._registeredChannels.get(namespaceName);
        return Boolean(namespaceMap && namespaceMap.has(channelName));
    }

    _resolveLocalNamespace(arg) {
        if (arg instanceof TraceLogger) {
            return arg.getNamespace();
        }
        return trimWhitespace(arg || "");
    }

    _applySelectors(selectorsCsv, localNamespace, action) {
        const selectors = parseSelectorList(selectorsCsv, localNamespace);
        const qualifiedChannels = [];
        for (const [traceNamespace, channelMap] of this._registeredChannels.entries()) {
            for (const channelName of channelMap.keys()) {
                qualifiedChannels.push(`${traceNamespace}.${channelName}`);
            }
        }

        for (const selector of selectors) {
            const matched = qualifiedChannels.filter((qualified) => selectorMatchesQualifiedChannel(selector, qualified));
            if (matched.length === 0) {
                this._emitSelectorWarning(localNamespace, action, selector.display);
                continue;
            }
            for (const qualified of matched) {
                if (action === "enable") {
                    this._enabledChannels.add(qualified);
                } else {
                    this._enabledChannels.delete(qualified);
                }
            }
        }
    }

    enableChannel(arg1, arg2) {
        const qualifiedChannel = parseQualifiedChannel(
            arg1 instanceof TraceLogger ? arg2 : arg1,
            this._resolveLocalNamespace(arg1 instanceof TraceLogger ? arg1 : arg2)
        );
        if (this._hasRegisteredChannel(qualifiedChannel)) {
            this._enabledChannels.add(qualifiedChannel);
        }
    }

    enableChannels(arg1, arg2) {
        let selectorsCsv = arg1;
        let localNamespace = arg2;
        if (arg1 instanceof TraceLogger) {
            selectorsCsv = arg2;
            localNamespace = arg1.getNamespace();
        }
        selectorsCsv = String(selectorsCsv);
        localNamespace = this._resolveLocalNamespace(localNamespace);
        this._applySelectors(selectorsCsv, localNamespace, "enable");
    }

    disableChannel(arg1, arg2) {
        const qualifiedChannel = parseQualifiedChannel(
            arg1 instanceof TraceLogger ? arg2 : arg1,
            this._resolveLocalNamespace(arg1 instanceof TraceLogger ? arg1 : arg2)
        );
        if (this._hasRegisteredChannel(qualifiedChannel)) {
            this._enabledChannels.delete(qualifiedChannel);
        }
    }

    disableChannels(arg1, arg2) {
        let selectorsCsv = arg1;
        let localNamespace = arg2;
        if (arg1 instanceof TraceLogger) {
            selectorsCsv = arg2;
            localNamespace = arg1.getNamespace();
        }
        selectorsCsv = String(selectorsCsv);
        localNamespace = this._resolveLocalNamespace(localNamespace);
        this._applySelectors(selectorsCsv, localNamespace, "disable");
    }

    shouldTraceChannel(arg1, arg2) {
        if (arg1 instanceof TraceLogger) {
            return this.shouldTraceChannel(arg2, arg1.getNamespace());
        }
        try {
            const qualified = parseQualifiedChannel(arg1, this._resolveLocalNamespace(arg2));
            return this._enabledChannels.has(qualified);
        } catch (error) {
            return false;
        }
    }

    setOutputOptions(options) {
        const normalized = cloneOutputOptions(options);
        if (normalized.functionNames) {
            normalized.filenames = true;
            normalized.lineNumbers = true;
        }
        this._outputOptions = normalized;
    }

    getOutputOptions() {
        return cloneOutputOptions(this._outputOptions);
    }

    getNamespaces() {
        return Array.from(this._registeredChannels.keys()).sort();
    }

    getChannels(traceNamespace) {
        const channelMap = this._registeredChannels.get(String(traceNamespace)) || new Map();
        return Array.from(channelMap.keys()).sort();
    }

    makeInlineParser(localTraceLogger, traceRoot = "trace") {
        return createTraceInlineParser({
            logger: this,
            localTraceLogger,
            traceRoot,
            colorNames: COLOR_NAMES,
        });
    }
}

module.exports = {
    color,
    Logger,
    TraceLogger,
    _internal: {
        COLOR_NAMES,
        captureSite,
        createOutputOptions,
        formatMessage,
    },
};
