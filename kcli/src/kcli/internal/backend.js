"use strict";

const {
    ValueArity,
    createAliasBinding,
    createCommandBinding,
    createInlineParserData,
} = require("./model");
const {
    normalizeAliasOrThrow,
    normalizeAliasTargetOptionOrThrow,
    normalizeDescriptionOrThrow,
    normalizeHelpPlaceholderOrThrow,
    normalizeInlineHandlerOptionOrThrow,
    normalizeInlineRootOptionOrThrow,
    normalizePrimaryHandlerOptionOrThrow,
    validateHandlerArity,
} = require("./normalize");

function cloneInlineParserData(data) {
    const clone = createInlineParserData();
    clone.rootName = data.rootName;
    clone.rootValueHandler = data.rootValueHandler;
    clone.rootValuePlaceholder = data.rootValuePlaceholder;
    clone.rootValueDescription = data.rootValueDescription;
    clone.commands = data.commands.map(([name, binding]) => [name, {
        expectsValue: binding.expectsValue,
        flagHandler: binding.flagHandler,
        valueHandler: binding.valueHandler,
        valueArity: binding.valueArity,
        description: binding.description,
    }]);
    return clone;
}

function makeFlagBinding(handler, description) {
    validateHandlerArity(handler, 1, "kcli flag handler must not be empty");
    const binding = createCommandBinding();
    binding.expectsValue = false;
    binding.flagHandler = handler;
    binding.description = normalizeDescriptionOrThrow(description);
    return binding;
}

function makeValueBinding(handler, description, arity) {
    validateHandlerArity(handler, 2, "kcli value handler must not be empty");
    const binding = createCommandBinding();
    binding.expectsValue = true;
    binding.valueHandler = handler;
    binding.valueArity = arity;
    binding.description = normalizeDescriptionOrThrow(description);
    return binding;
}

function upsertCommand(commands, command, binding) {
    const index = commands.findIndex(([existing]) => existing === command);
    if (index >= 0) {
        commands[index] = [command, binding];
        return;
    }
    commands.push([command, binding]);
}

function setInlineRoot(data, root) {
    data.rootName = normalizeInlineRootOptionOrThrow(root);
}

function setRootValueHandler(data, handler) {
    validateHandlerArity(handler, 2, "kcli root value handler must not be empty");
    data.rootValueHandler = handler;
    data.rootValuePlaceholder = "";
    data.rootValueDescription = "";
}

function setRootValueHandlerWithHelp(data, handler, valuePlaceholder, description) {
    validateHandlerArity(handler, 2, "kcli root value handler must not be empty");
    data.rootValueHandler = handler;
    data.rootValuePlaceholder = normalizeHelpPlaceholderOrThrow(valuePlaceholder);
    data.rootValueDescription = normalizeDescriptionOrThrow(description);
}

function setInlineHandlerFlag(data, option, handler, description) {
    const command = normalizeInlineHandlerOptionOrThrow(option, data.rootName);
    upsertCommand(data.commands, command, makeFlagBinding(handler, description));
}

function setInlineHandlerValue(data, option, handler, description) {
    const command = normalizeInlineHandlerOptionOrThrow(option, data.rootName);
    upsertCommand(data.commands, command, makeValueBinding(handler, description, ValueArity.REQUIRED));
}

function setInlineOptionalValueHandler(data, option, handler, description) {
    const command = normalizeInlineHandlerOptionOrThrow(option, data.rootName);
    upsertCommand(data.commands, command, makeValueBinding(handler, description, ValueArity.OPTIONAL));
}

function setAlias(data, alias, target, presetTokens) {
    const normalizedBinding = createAliasBinding();
    normalizedBinding.alias = normalizeAliasOrThrow(alias);
    normalizedBinding.targetToken = normalizeAliasTargetOptionOrThrow(target);
    normalizedBinding.presetTokens = Array.from(presetTokens || [], (token) => String(token));
    const index = data.aliases.findIndex((binding) => binding.alias === normalizedBinding.alias);
    if (index >= 0) {
        data.aliases[index] = normalizedBinding;
        return;
    }
    data.aliases.push(normalizedBinding);
}

function setPrimaryHandlerFlag(data, option, handler, description) {
    const command = normalizePrimaryHandlerOptionOrThrow(option);
    upsertCommand(data.commands, command, makeFlagBinding(handler, description));
}

function setPrimaryHandlerValue(data, option, handler, description) {
    const command = normalizePrimaryHandlerOptionOrThrow(option);
    upsertCommand(data.commands, command, makeValueBinding(handler, description, ValueArity.REQUIRED));
}

function setPrimaryOptionalValueHandler(data, option, handler, description) {
    const command = normalizePrimaryHandlerOptionOrThrow(option);
    upsertCommand(data.commands, command, makeValueBinding(handler, description, ValueArity.OPTIONAL));
}

function setPositionalHandler(data, handler) {
    validateHandlerArity(handler, 1, "kcli positional handler must not be empty");
    data.positionalHandler = handler;
}

function addInlineParser(data, parser) {
    if (data.inlineParsers.some((existing) => existing.rootName === parser.rootName)) {
        throw new Error(`kcli inline parser root '--${parser.rootName}' is already registered`);
    }
    data.inlineParsers.push(parser);
}

module.exports = {
    addInlineParser,
    cloneInlineParserData,
    setAlias,
    setInlineHandlerFlag,
    setInlineHandlerValue,
    setInlineOptionalValueHandler,
    setInlineRoot,
    setPositionalHandler,
    setPrimaryHandlerFlag,
    setPrimaryHandlerValue,
    setPrimaryOptionalValueHandler,
    setRootValueHandler,
    setRootValueHandlerWithHelp,
};
