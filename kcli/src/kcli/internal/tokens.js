"use strict";

const {
    InlineTokenKind,
    createCollectedValues,
    createInlineTokenMatch,
} = require("./model");
const { startsWith } = require("./normalize");

function isCollectableFollowOnValueToken(value) {
    return !(value && value[0] === "-");
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
    collected.hasValue = true;
    collected.parts.push(first);
    consumed[firstValueIndex] = true;
    collected.lastIndex = firstValueIndex;
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
        collected.lastIndex = scan;
    }
    return collected;
}

function buildParseTokens(argc, argv) {
    const tokens = [];
    for (let index = 0; index < argc; ++index) {
        const value = argv[index];
        tokens.push(value == null ? "" : String(value));
    }
    return tokens;
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
    return aliasBinding !== null && aliasBinding.presetTokens.length > 0;
}

function buildEffectiveValueTokens(aliasBinding, collectedParts) {
    if (!hasAliasPresetTokens(aliasBinding)) {
        return Array.from(collectedParts);
    }
    return [...aliasBinding.presetTokens, ...collectedParts];
}

function matchInlineToken(data, arg) {
    for (const parser of data.inlineParsers) {
        const rootOption = `--${parser.rootName}`;
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

module.exports = {
    buildEffectiveValueTokens,
    buildParseTokens,
    collectValueTokens,
    consumeIndex,
    findAliasBinding,
    findCommand,
    hasAliasPresetTokens,
    matchInlineToken,
};
