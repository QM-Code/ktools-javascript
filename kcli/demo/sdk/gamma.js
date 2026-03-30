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
