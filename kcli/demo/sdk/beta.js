"use strict";

const { loadKcli } = require("../../src/kcli/deps");

const kcli = loadKcli(__filename);

function printProcessingLine(context, value) {
    if (!context.valueTokens.length) {
        console.log(`Processing ${context.option}`);
        return;
    }
    if (context.valueTokens.length === 1) {
        console.log(`Processing ${context.option} with value "${value}"`);
        return;
    }
    const joined = context.valueTokens.map((token) => `"${token}"`).join(",");
    console.log(`Processing ${context.option} with values [${joined}]`);
}

function parseIntOrThrow(value) {
    if (!/^-?\d+$/.test(value)) {
        throw new Error("expected an integer");
    }
    return Number.parseInt(value, 10);
}

function handleProfile(context, value) {
    printProcessingLine(context, value);
}

function handleWorkers(context, value) {
    if (value) {
        parseIntOrThrow(value);
    }
    printProcessingLine(context, value);
}

function getInlineParser() {
    const parser = new kcli.InlineParser("--beta");
    parser.setHandler("-profile", handleProfile, "Select beta runtime profile.");
    parser.setHandler("-workers", handleWorkers, "Set beta worker count.");
    return parser;
}

module.exports = {
    getInlineParser,
};
