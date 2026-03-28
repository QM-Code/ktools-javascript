"use strict";

const path = require("node:path");

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

module.exports = {
    buildPrefix,
    captureSite,
    cloneOutputOptions,
    createOutputOptions,
    formatTimestamp,
    writeLine,
};
