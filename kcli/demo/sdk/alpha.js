"use strict";

const { loadKcli, printProcessingLine } = require("./common");

const kcli = loadKcli(__filename);

function handleMessage(context, value) {
    printProcessingLine(context, value);
}

function handleEnable(context, value) {
    printProcessingLine(context, value);
}

function getInlineParser() {
    const parser = new kcli.InlineParser("--alpha");
    parser.setHandler("-message", handleMessage, "Set alpha message label.");
    parser.setOptionalValueHandler("-enable", handleEnable, "Enable alpha processing.");
    return parser;
}

module.exports = {
    getInlineParser,
};
