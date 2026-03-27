"use strict";

const { loadKcli, printProcessingLine } = require("./common");

const kcli = loadKcli(__filename);

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
