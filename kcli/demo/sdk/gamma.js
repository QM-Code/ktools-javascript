"use strict";

const { loadKcli, printProcessingLine } = require("./common");

const kcli = loadKcli(__filename);

function handleStrict(context, value) {
    printProcessingLine(context, value);
}

function handleTag(context, value) {
    printProcessingLine(context, value);
}

function getInlineParser() {
    const parser = new kcli.InlineParser("--gamma");
    parser.setOptionalValueHandler("-strict", handleStrict, "Enable strict gamma mode.");
    parser.setHandler("-tag", handleTag, "Set a gamma tag label.");
    return parser;
}

module.exports = {
    getInlineParser,
};
