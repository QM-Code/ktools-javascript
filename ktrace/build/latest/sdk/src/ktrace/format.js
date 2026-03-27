"use strict";

function formatArgument(value) {
    if (typeof value === "string") {
        return value;
    }
    if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") {
        return String(value);
    }
    if (value == null) {
        return String(value);
    }
    return String(value);
}

function formatMessage(formatText, ...args) {
    const text = String(formatText);
    let output = "";
    let argIndex = 0;

    for (let index = 0; index < text.length; index += 1) {
        const ch = text[index];
        if (ch === "{") {
            if (index + 1 >= text.length) {
                throw new Error("unterminated '{' in trace format string");
            }
            const next = text[index + 1];
            if (next === "{") {
                output += "{";
                index += 1;
                continue;
            }
            if (next === "}") {
                if (argIndex >= args.length) {
                    throw new Error("not enough arguments for trace format string");
                }
                output += formatArgument(args[argIndex]);
                argIndex += 1;
                index += 1;
                continue;
            }
            throw new Error("unsupported trace format token");
        }
        if (ch === "}") {
            if (index + 1 < text.length && text[index + 1] === "}") {
                output += "}";
                index += 1;
                continue;
            }
            throw new Error("unmatched '}' in trace format string");
        }
        output += ch;
    }

    if (argIndex !== args.length) {
        throw new Error("too many arguments for trace format string");
    }
    return output;
}

module.exports = {
    formatMessage,
};
