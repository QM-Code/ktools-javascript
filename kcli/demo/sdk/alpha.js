"use strict";

const { loadKcli } = require("../../src/kcli/deps");

const kcli = loadKcli(__filename);

function printProcessingLine(context, value) {
    if (!context.value_tokens.length) {
        console.log(`Processing ${context.option}`);
        return;
    }
    if (context.value_tokens.length === 1) {
        console.log(`Processing ${context.option} with value "${value}"`);
        return;
    }
    const joined = context.value_tokens.map((token) => `"${token}"`).join(",");
    console.log(`Processing ${context.option} with values [${joined}]`);
}

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
