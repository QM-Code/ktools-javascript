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
    clone.root_name = data.root_name;
    clone.root_value_handler = data.root_value_handler;
    clone.root_value_placeholder = data.root_value_placeholder;
    clone.root_value_description = data.root_value_description;
    clone.commands = data.commands.map(([name, binding]) => [name, {
        expects_value: binding.expects_value,
        flag_handler: binding.flag_handler,
        value_handler: binding.value_handler,
        value_arity: binding.value_arity,
        description: binding.description,
    }]);
    return clone;
}

function makeFlagBinding(handler, description) {
    validateHandlerArity(handler, 1, "kcli flag handler must not be empty");
    const binding = createCommandBinding();
    binding.expects_value = false;
    binding.flag_handler = handler;
    binding.description = normalizeDescriptionOrThrow(description);
    return binding;
}

function makeValueBinding(handler, description, arity) {
    validateHandlerArity(handler, 2, "kcli value handler must not be empty");
    const binding = createCommandBinding();
    binding.expects_value = true;
    binding.value_handler = handler;
    binding.value_arity = arity;
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
    data.root_name = normalizeInlineRootOptionOrThrow(root);
}

function setRootValueHandler(data, handler) {
    validateHandlerArity(handler, 2, "kcli root value handler must not be empty");
    data.root_value_handler = handler;
    data.root_value_placeholder = "";
    data.root_value_description = "";
}

function setRootValueHandlerWithHelp(data, handler, valuePlaceholder, description) {
    validateHandlerArity(handler, 2, "kcli root value handler must not be empty");
    data.root_value_handler = handler;
    data.root_value_placeholder = normalizeHelpPlaceholderOrThrow(valuePlaceholder);
    data.root_value_description = normalizeDescriptionOrThrow(description);
}

function setInlineHandlerFlag(data, option, handler, description) {
    const command = normalizeInlineHandlerOptionOrThrow(option, data.root_name);
    upsertCommand(data.commands, command, makeFlagBinding(handler, description));
}

function setInlineHandlerValue(data, option, handler, description) {
    const command = normalizeInlineHandlerOptionOrThrow(option, data.root_name);
    upsertCommand(data.commands, command, makeValueBinding(handler, description, ValueArity.REQUIRED));
}

function setInlineOptionalValueHandler(data, option, handler, description) {
    const command = normalizeInlineHandlerOptionOrThrow(option, data.root_name);
    upsertCommand(data.commands, command, makeValueBinding(handler, description, ValueArity.OPTIONAL));
}

function setAlias(data, alias, target, presetTokens) {
    const normalizedBinding = createAliasBinding();
    normalizedBinding.alias = normalizeAliasOrThrow(alias);
    normalizedBinding.target_token = normalizeAliasTargetOptionOrThrow(target);
    normalizedBinding.preset_tokens = Array.from(presetTokens || [], (token) => String(token));
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
    data.positional_handler = handler;
}

function addInlineParser(data, parser) {
    if (data.inline_parsers.some((existing) => existing.root_name === parser.root_name)) {
        throw new Error(`kcli inline parser root '--${parser.root_name}' is already registered`);
    }
    data.inline_parsers.push(parser);
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
