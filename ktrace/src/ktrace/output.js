"use strict";

const path = require("node:path");

function createOutputOptions() {
    return {
        filenames: false,
        lineNumbers: false,
        functionNames: false,
        timestamps: false,
    };
}

function cloneOutputOptions(options) {
    return {
        filenames: Boolean(options && options.filenames),
        lineNumbers: Boolean(options && options.lineNumbers),
        functionNames: Boolean(options && options.functionNames),
        timestamps: Boolean(options && options.timestamps),
    };
}

function baseNameWithoutExtension(filePath) {
    return path.basename(String(filePath || ""), path.extname(String(filePath || "")));
}

function normalizeStackPath(filePath) {
    return String(filePath || "").replaceAll("\\", "/");
}

function captureSite() {
    const error = new Error();
    const stack = String(error.stack || "").split("\n").slice(1);
    const internalDir = normalizeStackPath(__dirname) + "/";
    for (const line of stack) {
        const match = line.match(/\s*at\s+(?:(.*?)\s+\()?(.+?):(\d+):(\d+)\)?$/);
        if (!match) {
            continue;
        }
        const filePath = match[2];
        if (!filePath) {
            continue;
        }
        // Skip frames from the ktrace package itself so file/function output
        // resolves to the application or demo callsite in both source and SDK builds.
        if (normalizeStackPath(filePath).startsWith(internalDir)) {
            continue;
        }
        return {
            file: filePath,
            line: Number.parseInt(match[3], 10),
            column: Number.parseInt(match[4], 10),
            functionName: match[1] || "",
        };
    }
    return {
        file: "",
        line: 0,
        column: 0,
        functionName: "",
    };
}

function formatTimestamp() {
    return (Date.now() / 1000).toFixed(6);
}

function buildPrefix(logger, traceNamespace, label, site) {
    const parts = [`[${traceNamespace}]`];
    const options = logger._outputOptions;
    if (options.timestamps) {
        parts.push(`[${formatTimestamp()}]`);
    }
    parts.push(`[${label}]`);
    if (options.filenames) {
        const fileBase = baseNameWithoutExtension(site.file);
        if (options.functionNames) {
            parts.push(`[${fileBase}:${site.line}:${site.functionName || "<anonymous>"}]`);
        } else if (options.lineNumbers) {
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

module.exports = {
    buildPrefix,
    captureSite,
    cloneOutputOptions,
    createOutputOptions,
    formatTimestamp,
    writeLine,
};
