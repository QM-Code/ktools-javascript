"use strict";

const {
    InlineTokenKind,
    InvocationKind,
    createInvocation,
    createParseOutcome,
} = require("./model");
const { buildHelpRows } = require("./help");
const {
    executeInvocations,
    scheduleInvocation,
    schedulePositionals,
} = require("./invocations");
const {
    makeError,
    startsWith,
    throwCliError,
} = require("./normalize");
const {
    buildEffectiveValueTokens,
    buildParseTokens,
    collectValueTokens,
    consumeIndex,
    findAliasBinding,
    findCommand,
    hasAliasPresetTokens,
    matchInlineToken,
} = require("./tokens");

function formatOptionErrorMessage(option, message) {
    if (!option) {
        return message;
    }
    return `option '${option}': ${message}`;
}

function reportError(result, option, message) {
    if (result.ok) {
        result.ok = false;
        result.errorOption = option;
        result.errorMessage = message;
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
                effectiveArg = aliasBinding.targetToken;
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
                if (!collected.hasValue && !hasAliasPresetTokens(aliasBinding)) {
                    const help = createInvocation();
                    help.kind = InvocationKind.PRINT_HELP;
                    help.root = inlineMatch.parser.rootName;
                    help.helpRows = buildHelpRows(inlineMatch.parser);
                    invocations.push(help);
                } else if (!inlineMatch.parser.rootValueHandler) {
                    reportError(result, effectiveArg, `unknown value for option '${effectiveArg}'`);
                } else {
                    const invocation = createInvocation();
                    invocation.kind = InvocationKind.VALUE;
                    invocation.root = inlineMatch.parser.rootName;
                    invocation.option = effectiveArg;
                    invocation.valueHandler = inlineMatch.parser.rootValueHandler;
                    invocation.valueTokens = buildEffectiveValueTokens(aliasBinding, collected.parts);
                    invocations.push(invocation);
                    if (collected.hasValue) {
                        index = collected.lastIndex;
                    }
                }
            } else if (inlineMatch.kind === InlineTokenKind.DASH_OPTION) {
                const binding = findCommand(inlineMatch.parser.commands, inlineMatch.suffix);
                if (inlineMatch.suffix && binding !== null) {
                    index = scheduleInvocation({
                        binding,
                        aliasBinding,
                        root: inlineMatch.parser.rootName,
                        command: inlineMatch.suffix,
                        optionToken: effectiveArg,
                        index,
                        tokens,
                        consumed,
                        invocations,
                        setError: (option, message) => reportError(result, option, message),
                    });
                }
            } else {
                const command = effectiveArg.slice(2);
                const binding = findCommand(data.commands, command);
                if (binding !== null) {
                    index = scheduleInvocation({
                        binding,
                        aliasBinding,
                        root: "",
                        command,
                        optionToken: effectiveArg,
                        index,
                        tokens,
                        consumed,
                        invocations,
                        setError: (option, message) => reportError(result, option, message),
                    });
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
        executeInvocations(
            invocations,
            result,
            (option, message) => reportError(result, option, message),
            formatOptionErrorMessage
        );
    }

    if (!result.ok) {
        throwCliError(result);
    }
}

module.exports = {
    parse,
};
