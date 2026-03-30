"use strict";

const { ValueArity } = require("./model");

function printHelp(invocation) {
    let output = `\nAvailable --${invocation.root}-* options:\n`;
    let maxLhs = 0;
    for (const [lhs] of invocation.helpRows) {
        maxLhs = Math.max(maxLhs, lhs.length);
    }
    if (invocation.helpRows.length === 0) {
        output += "  (no options registered)\n";
    } else {
        for (const [lhs, rhs] of invocation.helpRows) {
            const padding = maxLhs > lhs.length ? maxLhs - lhs.length : 0;
            output += `  ${lhs}${" ".repeat(padding + 2)}${rhs}\n`;
        }
    }
    output += "\n";
    process.stdout.write(output);
}

function buildHelpRows(parser) {
    const prefix = `--${parser.rootName}-`;
    const rows = [];
    if (parser.rootValueHandler && parser.rootValueDescription) {
        let lhs = `--${parser.rootName}`;
        if (parser.rootValuePlaceholder) {
            lhs += ` ${parser.rootValuePlaceholder}`;
        }
        rows.push([lhs, parser.rootValueDescription]);
    }
    for (const [command, binding] of parser.commands) {
        let lhs = prefix + command;
        if (binding.expectsValue) {
            if (binding.valueArity === ValueArity.OPTIONAL) {
                lhs += " [value]";
            } else if (binding.valueArity === ValueArity.REQUIRED) {
                lhs += " <value>";
            }
        }
        rows.push([lhs, binding.description]);
    }
    return rows;
}

module.exports = {
    buildHelpRows,
    printHelp,
};
