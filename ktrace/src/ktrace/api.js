"use strict";

const path = require("node:path");

const { loadKcli } = require("./deps");
const { formatMessage } = require("./format");
const {
    isIdentifier,
    isValidChannelPath,
    parseQualifiedChannel,
    parseSelectorList,
    selectorMatchesQualifiedChannel,
    trimWhitespace,
} = require("./selectors");

const COLOR_NAMES = Object.freeze([
    "Default",
    "BrightCyan",
    "BrightYellow",
    "DeepSkyBlue1",
    "Gold3",
    "LightSalmon1",
    "Red",
]);

function Color(colorName) {
    const token = trimWhitespace(colorName);
    if (!token) {
        throw new Error("trace color name must not be empty");
    }
    if (!COLOR_NAMES.includes(token) && token.toLowerCase() !== "default") {
        throw new Error(`unknown trace color '${token}'`);
    }
    return token;
}

function createOutputOptions() {
    return {
        filenames: false,
        line_numbers: false,
        function_names: false,
        timestamps: false,
    };
}

function cloneOutputOptions(options) {
    return {
        filenames: Boolean(options && options.filenames),
        line_numbers: Boolean(options && options.line_numbers),
        function_names: Boolean(options && options.function_names),
        timestamps: Boolean(options && options.timestamps),
    };
}

function baseNameWithoutExtension(filePath) {
    return path.basename(String(filePath || ""), path.extname(String(filePath || "")));
}

function captureSite() {
    const error = new Error();
    const stack = String(error.stack || "").split("\n").slice(1);
    for (const line of stack) {
        const match = line.match(/\s*at\s+(?:(.*?)\s+\()?(.+?):(\d+):(\d+)\)?$/);
        if (!match) {
            continue;
        }
        const filePath = match[2];
        if (!filePath || filePath.includes(path.join("ktrace", "src", "ktrace"))) {
            continue;
        }
        return {
            file: filePath,
            line: Number.parseInt(match[3], 10),
            column: Number.parseInt(match[4], 10),
            function_name: match[1] || "",
        };
    }
    return {
        file: "",
        line: 0,
        column: 0,
        function_name: "",
    };
}

function formatTimestamp() {
    return (Date.now() / 1000).toFixed(6);
}

function buildPrefix(logger, traceNamespace, label, site) {
    const parts = [`[${traceNamespace}]`];
    const options = logger._output_options;
    if (options.timestamps) {
        parts.push(`[${formatTimestamp()}]`);
    }
    parts.push(`[${label}]`);
    if (options.filenames) {
        const fileBase = baseNameWithoutExtension(site.file);
        if (options.function_names) {
            parts.push(`[${fileBase}:${site.line}:${site.function_name || "<anonymous>"}]`);
        } else if (options.line_numbers) {
            parts.push(`[${fileBase}:${site.line}]`);
        } else {
            parts.push(`[${fileBase}]`);
        }
    }
    return parts.join(" ");
}

function writeLine(prefix, message) {
    process.stdout.write(`${prefix} ${message}\n`);
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
        trace_namespace: validateNamespaceOrThrow(traceNamespace),
        channels: new Map(),
        attached_logger: null,
        changed_keys: new Map(),
    };
}

class TraceLogger {
    constructor(traceNamespace, sharedData) {
        this._data = sharedData || createTraceLoggerData(traceNamespace);
    }

    addChannel(channel, color = "Default") {
        const channelName = validateChannelOrThrow(channel);
        const normalizedColor = Color(color);
        const existing = this._data.channels.get(channelName);
        if (existing && existing !== "Default" && normalizedColor !== "Default" && existing !== normalizedColor) {
            throw new Error(`conflicting explicit trace color for '${this._data.trace_namespace}.${channelName}'`);
        }
        this._data.channels.set(channelName, normalizedColor);
        if (this._data.attached_logger) {
            this._data.attached_logger._registerTraceLoggerData(this._data);
        }
    }

    getNamespace() {
        return this._data.trace_namespace;
    }

    shouldTraceChannel(channel) {
        const logger = this._data.attached_logger;
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
        const logger = this._data.attached_logger;
        if (!logger) {
            return;
        }
        if (!logger._enabled_channels.has(`${this.getNamespace()}.${channelName}`)) {
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
        if (this._data.changed_keys.get(siteKey) === normalizedKey) {
            return;
        }
        this._data.changed_keys.set(siteKey, normalizedKey);
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
        const logger = this._data.attached_logger;
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
        this._output_options = createOutputOptions();
        this._trace_loggers = new Map();
        this._registered_channels = new Map();
        this._enabled_channels = new Set();
    }

    _registerTraceLoggerData(traceLoggerData) {
        const namespaceName = traceLoggerData.trace_namespace;
        let namespaceMap = this._registered_channels.get(namespaceName);
        if (!namespaceMap) {
            namespaceMap = new Map();
            this._registered_channels.set(namespaceName, namespaceMap);
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
        traceLogger._data.attached_logger = this;
        this._trace_loggers.set(traceLogger.getNamespace(), traceLogger._data);
    }

    _emitSelectorWarning(localNamespace, action, selectorDisplay) {
        const namespaceName = trimWhitespace(localNamespace) || "ktrace";
        const site = captureSite();
        const prefix = buildPrefix(this, namespaceName, "warning", site);
        writeLine(prefix, `${action} ignored channel selector '${selectorDisplay}' because it matched no registered channels`);
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
        for (const [traceNamespace, channelMap] of this._registered_channels.entries()) {
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
                    this._enabled_channels.add(qualified);
                } else {
                    this._enabled_channels.delete(qualified);
                }
            }
        }
    }

    enableChannel(arg1, arg2) {
        if (arg1 instanceof TraceLogger) {
            this.enableChannels(arg2, arg1.getNamespace());
            return;
        }
        this.enableChannels(arg1, arg2);
    }

    enableChannels(arg1, arg2) {
        const selectorsCsv = String(arg1);
        const localNamespace = this._resolveLocalNamespace(arg2);
        this._applySelectors(selectorsCsv, localNamespace, "enable");
    }

    disableChannel(arg1, arg2) {
        if (arg1 instanceof TraceLogger) {
            this.disableChannels(arg2, arg1.getNamespace());
            return;
        }
        this.disableChannels(arg1, arg2);
    }

    disableChannels(arg1, arg2) {
        const selectorsCsv = String(arg1);
        const localNamespace = this._resolveLocalNamespace(arg2);
        this._applySelectors(selectorsCsv, localNamespace, "disable");
    }

    shouldTraceChannel(arg1, arg2) {
        if (arg1 instanceof TraceLogger) {
            return this.shouldTraceChannel(arg2, arg1.getNamespace());
        }
        try {
            const qualified = parseQualifiedChannel(arg1, this._resolveLocalNamespace(arg2));
            return this._enabled_channels.has(qualified);
        } catch (error) {
            return false;
        }
    }

    setOutputOptions(options) {
        const normalized = cloneOutputOptions(options);
        if (normalized.function_names) {
            normalized.filenames = true;
            normalized.line_numbers = true;
        }
        this._output_options = normalized;
    }

    getOutputOptions() {
        return cloneOutputOptions(this._output_options);
    }

    getNamespaces() {
        return Array.from(this._registered_channels.keys()).sort();
    }

    getChannels(traceNamespace) {
        const channelMap = this._registered_channels.get(String(traceNamespace)) || new Map();
        return Array.from(channelMap.keys()).sort();
    }

    makeInlineParser(localTraceLogger, traceRoot = "trace") {
        const kcli = loadKcli(__filename);
        const parser = new kcli.InlineParser(traceRoot);
        const localNamespace = localTraceLogger.getNamespace();

        parser.setRootValueHandler((context, value) => {
            void context;
            this.enableChannels(value, localNamespace);
        }, "<channels>", "Trace selected channels.");

        parser.setHandler("-examples", (context) => {
            process.stdout.write(
                "\nGeneral trace selector pattern:\n" +
                `  --${context.root} <namespace>.<channel>[.<subchannel>]\n\n` +
                "Trace selector examples:\n" +
                `  --${context.root} '.app'\n` +
                `  --${context.root} '*.*'\n` +
                `  --${context.root} '*.{net,io}'\n\n`
            );
        }, "Show selector examples.");

        parser.setHandler("-namespaces", () => {
            const namespaces = this.getNamespaces();
            if (!namespaces.length) {
                process.stdout.write("No trace namespaces defined.\n\n");
                return;
            }
            process.stdout.write("\nAvailable trace namespaces:\n");
            for (const traceNamespace of namespaces) {
                process.stdout.write(`  ${traceNamespace}\n`);
            }
            process.stdout.write("\n");
        }, "Show initialized trace namespaces.");

        parser.setHandler("-channels", () => {
            const namespaces = this.getNamespaces();
            if (!namespaces.length) {
                process.stdout.write("No trace channels defined.\n\n");
                return;
            }
            process.stdout.write("\nAvailable trace channels:\n");
            for (const traceNamespace of namespaces) {
                for (const channelName of this.getChannels(traceNamespace)) {
                    process.stdout.write(`  ${traceNamespace}.${channelName}\n`);
                }
            }
            process.stdout.write("\n");
        }, "Show initialized trace channels.");

        parser.setHandler("-colors", () => {
            process.stdout.write("\nAvailable trace colors:\n");
            for (const colorName of COLOR_NAMES) {
                process.stdout.write(`  ${colorName}\n`);
            }
            process.stdout.write("\n");
        }, "Show available trace colors.");

        parser.setHandler("-files", () => {
            const options = this.getOutputOptions();
            options.filenames = true;
            options.line_numbers = true;
            this.setOutputOptions(options);
        }, "Include source file and line in trace output.");

        parser.setHandler("-functions", () => {
            const options = this.getOutputOptions();
            options.function_names = true;
            this.setOutputOptions(options);
        }, "Include function names in trace output.");

        parser.setHandler("-timestamps", () => {
            const options = this.getOutputOptions();
            options.timestamps = true;
            this.setOutputOptions(options);
        }, "Include timestamps in trace output.");

        return parser;
    }
}

module.exports = {
    Color,
    Logger,
    TraceLogger,
    _internal: {
        COLOR_NAMES,
        captureSite,
        createOutputOptions,
        formatMessage,
    },
};
