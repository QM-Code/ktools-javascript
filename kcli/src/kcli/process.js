"use strict";

const {
    HandlerContext,
    InlineTokenKind,
    InvocationKind,
    ValueArity,
    createCollectedValues,
    createInlineTokenMatch,
    createInvocation,
    createParseOutcome,
} = require("./model");
const {
    makeError,
    startsWith,
    throwCliError,
} = require("./normalize");

function isCollectableFollowOnValueToken(value) {
    return !(value && value[0] === "-");
}

function joinWithSpaces(parts) {
    return parts.join(" ");
}

function formatOptionErrorMessage(option, message) {
    if (!option) {
        return message;
    }
    return `option '${option}': ${message}`;
}

function reportError(result, option, message) {
    if (result.ok) {
        result.ok = false;
        result.error_option = option;
        result.error_message = message;
    }
}

function collectValueTokens(optionIndex, tokens, consumed, allowOptionLikeFirstValue) {
    const collected = createCollectedValues(optionIndex);
    const firstValueIndex = optionIndex + 1;
    const hasNext = firstValueIndex >= 0 &&
        firstValueIndex < tokens.length &&
        !consumed[firstValueIndex];
    if (!hasNext) {
        return collected;
    }
    const first = tokens[firstValueIndex];
    if (!allowOptionLikeFirstValue && first && first[0] === "-") {
        return collected;
    }
    collected.has_value = true;
    collected.parts.push(first);
    consumed[firstValueIndex] = true;
    collected.last_index = firstValueIndex;
    if (allowOptionLikeFirstValue && first && first[0] === "-") {
        return collected;
    }
    for (let scan = firstValueIndex + 1; scan < tokens.length; ++scan) {
        if (consumed[scan]) {
            continue;
        }
        const nextToken = tokens[scan];
        if (!isCollectableFollowOnValueToken(nextToken)) {
            break;
        }
        collected.parts.push(nextToken);
        consumed[scan] = true;
        collected.last_index = scan;
    }
    return collected;
}

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

function consumeIndex(consumed, index) {
    if (index >= 0 && index < consumed.length && !consumed[index]) {
        consumed[index] = true;
    }
}

function findCommand(commands, command) {
    for (const [existingCommand, binding] of commands) {
        if (existingCommand === command) {
            return binding;
        }
    }
    return null;
}

function findAliasBinding(data, token) {
    return data.aliases.find((alias) => token === alias.alias) || null;
}

function hasAliasPresetTokens(aliasBinding) {
    return aliasBinding !== null && aliasBinding.preset_tokens.length > 0;
}

function buildEffectiveValueTokens(aliasBinding, collectedParts) {
    if (!hasAliasPresetTokens(aliasBinding)) {
        return Array.from(collectedParts);
    }
    return [...aliasBinding.preset_tokens, ...collectedParts];
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

function matchInlineToken(data, arg) {
    for (const parser of data.inline_parsers) {
        const rootOption = `--${parser.root_name}`;
        if (arg === rootOption) {
            return {
                kind: InlineTokenKind.BARE_ROOT,
                parser,
                suffix: "",
            };
        }
        const rootDashPrefix = `${rootOption}-`;
        if (startsWith(arg, rootDashPrefix)) {
            return {
                kind: InlineTokenKind.DASH_OPTION,
                parser,
                suffix: arg.slice(rootDashPrefix.length),
            };
        }
    }
    return createInlineTokenMatch();
}

function scheduleInvocation(
    binding,
    aliasBinding,
    root,
    command,
    optionToken,
    index,
    tokens,
    consumed,
    invocations,
    result
) {
    consumeIndex(consumed, index);
    const invocation = createInvocation();
    invocation.root = root;
    invocation.option = optionToken;
    invocation.command = command;

    if (!binding.expects_value) {
        if (hasAliasPresetTokens(aliasBinding)) {
            reportError(
                result,
                aliasBinding.alias,
                `alias '${aliasBinding.alias}' presets values for option '${optionToken}' which does not accept values`
            );
            return index;
        }
        invocation.kind = InvocationKind.FLAG;
        invocation.flag_handler = binding.flag_handler;
        invocations.push(invocation);
        return index;
    }

    const collected = collectValueTokens(
        index,
        tokens,
        consumed,
        binding.value_arity === ValueArity.REQUIRED
    );

    if (!collected.has_value &&
        !hasAliasPresetTokens(aliasBinding) &&
        binding.value_arity === ValueArity.REQUIRED) {
        reportError(result, optionToken, `option '${optionToken}' requires a value`);
        return index;
    }

    if (collected.has_value) {
        index = collected.last_index;
    }

    invocation.kind = InvocationKind.VALUE;
    invocation.value_handler = binding.value_handler;
    invocation.value_tokens = buildEffectiveValueTokens(aliasBinding, collected.parts);
    invocations.push(invocation);
    return index;
}

function schedulePositionals(data, tokens, consumed, invocations) {
    if (!data.positional_handler || tokens.length <= 1) {
        return;
    }
    const invocation = createInvocation();
    invocation.kind = InvocationKind.POSITIONAL;
    invocation.positional_handler = data.positional_handler;
    for (let index = 1; index < tokens.length; ++index) {
        if (consumed[index]) {
            continue;
        }
        const token = tokens[index];
        if (!token || token[0] !== "-") {
            consumed[index] = true;
            invocation.value_tokens.push(token);
        }
    }
    if (invocation.value_tokens.length > 0) {
        invocations.push(invocation);
    }
}

function buildParseTokens(argc, argv) {
    const tokens = [];
    for (let index = 0; index < argc; ++index) {
        const value = argv[index];
        tokens.push(value == null ? "" : String(value));
    }
    return tokens;
}

function executeInvocations(invocations, result) {
    for (const invocation of invocations) {
        if (!result.ok) {
            return;
        }
        if (invocation.kind === InvocationKind.PRINT_HELP) {
            printHelp(invocation);
            continue;
        }
        const context = new HandlerContext({
            root: invocation.root,
            option: invocation.option,
            command: invocation.command,
            value_tokens: invocation.value_tokens,
        });
        try {
            if (invocation.kind === InvocationKind.FLAG) {
                invocation.flag_handler(context);
            } else if (invocation.kind === InvocationKind.VALUE) {
                invocation.value_handler(context, joinWithSpaces(invocation.value_tokens));
            } else if (invocation.kind === InvocationKind.POSITIONAL) {
                invocation.positional_handler(context);
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            reportError(result, invocation.option, formatOptionErrorMessage(invocation.option, message));
        }
    }
}

function parse(data, argc, argv) {
    const result = createParseOutcome();
    if (argc > 0 && argv == null) {
        throwCliError(makeError("", "kcli received invalid argv (argc > 0 but argv is null)"));
    }
    if (argc <= 0 || argv == null) {
        return;
    }
    if (argv.length < argc) {
        throwCliError(makeError("", "kcli received invalid argv (argv shorter than argc)"));
    }

    const consumed = new Array(argc).fill(false);
    const invocations = [];
    const tokens = buildParseTokens(argc, argv);

    for (let index = 1; index < argc; ++index) {
        if (consumed[index]) {
            continue;
        }
        const arg = tokens[index];
        if (!arg) {
            continue;
        }

        let aliasBinding = null;
        let effectiveArg = arg;
        if (arg[0] === "-" && !startsWith(arg, "--")) {
            aliasBinding = findAliasBinding(data, arg);
            if (aliasBinding !== null) {
                effectiveArg = aliasBinding.target_token;
            }
        }

        if (effectiveArg[0] !== "-") {
            continue;
        }

        if (effectiveArg === "--") {
            continue;
        }

        if (startsWith(effectiveArg, "--")) {
            const inlineMatch = matchInlineToken(data, effectiveArg);
            if (inlineMatch.kind === InlineTokenKind.BARE_ROOT) {
                consumeIndex(consumed, index);
                const collected = collectValueTokens(index, tokens, consumed, false);
                if (!collected.has_value && !hasAliasPresetTokens(aliasBinding)) {
                    const help = createInvocation();
                    help.kind = InvocationKind.PRINT_HELP;
                    help.root = inlineMatch.parser.root_name;
                    help.help_rows = buildHelpRows(inlineMatch.parser);
                    invocations.push(help);
                } else if (!inlineMatch.parser.root_value_handler) {
                    reportError(result, effectiveArg, `unknown value for option '${effectiveArg}'`);
                } else {
                    const invocation = createInvocation();
                    invocation.kind = InvocationKind.VALUE;
                    invocation.root = inlineMatch.parser.root_name;
                    invocation.option = effectiveArg;
                    invocation.value_handler = inlineMatch.parser.root_value_handler;
                    invocation.value_tokens = buildEffectiveValueTokens(aliasBinding, collected.parts);
                    invocations.push(invocation);
                    if (collected.has_value) {
                        index = collected.last_index;
                    }
                }
            } else if (inlineMatch.kind === InlineTokenKind.DASH_OPTION) {
                const binding = findCommand(inlineMatch.parser.commands, inlineMatch.suffix);
                if (inlineMatch.suffix && binding !== null) {
                    index = scheduleInvocation(
                        binding,
                        aliasBinding,
                        inlineMatch.parser.root_name,
                        inlineMatch.suffix,
                        effectiveArg,
                        index,
                        tokens,
                        consumed,
                        invocations,
                        result
                    );
                }
            } else {
                const command = effectiveArg.slice(2);
                const binding = findCommand(data.commands, command);
                if (binding !== null) {
                    index = scheduleInvocation(
                        binding,
                        aliasBinding,
                        "",
                        command,
                        effectiveArg,
                        index,
                        tokens,
                        consumed,
                        invocations,
                        result
                    );
                }
            }
        }

        if (!result.ok) {
            break;
        }
    }

    if (result.ok) {
        schedulePositionals(data, tokens, consumed, invocations);
    }

    if (result.ok) {
        for (let scan = 1; scan < argc; ++scan) {
            if (consumed[scan]) {
                continue;
            }
            const token = tokens[scan];
            if (token && token[0] === "-") {
                reportError(result, token, `unknown option ${token}`);
                break;
            }
        }
    }

    if (result.ok) {
        executeInvocations(invocations, result);
    }

    if (!result.ok) {
        throwCliError(result);
    }
}

module.exports = {
    parse,
};
