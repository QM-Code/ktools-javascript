"use strict";

const {
    findRepoRoot,
    loadKcli,
} = require("../../src/kcli/deps");

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

module.exports = {
    findRepoRoot,
    loadKcli,
    printProcessingLine,
};
