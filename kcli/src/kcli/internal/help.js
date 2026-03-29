"use strict";

const { ValueArity } = require("./model");

function printHelp(invocation) {
    let output = `\nAvailable --${invocation.root}-* options:\n`;
    let maxLhs = 0;
    for (const [lhs] of invocation.help_rows) {
        maxLhs = Math.max(maxLhs, lhs.length);
    }
    if (invocation.help_rows.length === 0) {
        output += "  (no options registered)\n";
    } else {
        for (const [lhs, rhs] of invocation.help_rows) {
            const padding = maxLhs > lhs.length ? maxLhs - lhs.length : 0;
            output += `  ${lhs}${" ".repeat(padding + 2)}${rhs}\n`;
        }
    }
    output += "\n";
    process.stdout.write(output);
}

function buildHelpRows(parser) {
    const prefix = `--${parser.root_name}-`;
    const rows = [];
    if (parser.root_value_handler && parser.root_value_description) {
        let lhs = `--${parser.root_name}`;
        if (parser.root_value_placeholder) {
            lhs += ` ${parser.root_value_placeholder}`;
        }
        rows.push([lhs, parser.root_value_description]);
    }
    for (const [command, binding] of parser.commands) {
        let lhs = prefix + command;
        if (binding.expects_value) {
            if (binding.value_arity === ValueArity.OPTIONAL) {
                lhs += " [value]";
            } else if (binding.value_arity === ValueArity.REQUIRED) {
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
