"use strict";

const {
    HandlerContext,
    InvocationKind,
    ValueArity,
    createInvocation,
} = require("./model");
const { printHelp } = require("./help");
const {
    buildEffectiveValueTokens,
    collectValueTokens,
    consumeIndex,
    hasAliasPresetTokens,
} = require("./tokens");

function joinWithSpaces(parts) {
    return parts.join(" ");
}

function scheduleInvocation({
    binding,
    aliasBinding,
    root,
    command,
    optionToken,
    index,
    tokens,
    consumed,
    invocations,
    setError,
}) {
    consumeIndex(consumed, index);
    const invocation = createInvocation();
    invocation.root = root;
    invocation.option = optionToken;
    invocation.command = command;

    if (!binding.expectsValue) {
        if (hasAliasPresetTokens(aliasBinding)) {
            setError(
                aliasBinding.alias,
                `alias '${aliasBinding.alias}' presets values for option '${optionToken}' which does not accept values`
            );
            return index;
        }
        invocation.kind = InvocationKind.FLAG;
        invocation.flagHandler = binding.flagHandler;
        invocations.push(invocation);
        return index;
    }

    const collected = collectValueTokens(
        index,
        tokens,
        consumed,
        binding.valueArity === ValueArity.REQUIRED
    );

    if (!collected.hasValue &&
        !hasAliasPresetTokens(aliasBinding) &&
        binding.valueArity === ValueArity.REQUIRED) {
        setError(optionToken, `option '${optionToken}' requires a value`);
        return index;
    }

    if (collected.hasValue) {
        index = collected.lastIndex;
    }

    invocation.kind = InvocationKind.VALUE;
    invocation.valueHandler = binding.valueHandler;
    invocation.valueTokens = buildEffectiveValueTokens(aliasBinding, collected.parts);
    invocations.push(invocation);
    return index;
}

function schedulePositionals(data, tokens, consumed, invocations) {
    if (!data.positionalHandler || tokens.length <= 1) {
        return;
    }
    const invocation = createInvocation();
    invocation.kind = InvocationKind.POSITIONAL;
    invocation.positionalHandler = data.positionalHandler;
    for (let index = 1; index < tokens.length; ++index) {
        if (consumed[index]) {
            continue;
        }
        const token = tokens[index];
        if (!token || token[0] !== "-") {
            consumed[index] = true;
            invocation.valueTokens.push(token);
        }
    }
    if (invocation.valueTokens.length > 0) {
        invocations.push(invocation);
    }
}

function executeInvocations(invocations, result, setError, formatOptionErrorMessage) {
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
            valueTokens: invocation.valueTokens,
        });
        try {
            if (invocation.kind === InvocationKind.FLAG) {
                invocation.flagHandler(context);
            } else if (invocation.kind === InvocationKind.VALUE) {
                invocation.valueHandler(context, joinWithSpaces(invocation.valueTokens));
            } else if (invocation.kind === InvocationKind.POSITIONAL) {
                invocation.positionalHandler(context);
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            setError(invocation.option, formatOptionErrorMessage(invocation.option, message));
        }
    }
}

module.exports = {
    executeInvocations,
    scheduleInvocation,
    schedulePositionals,
};
