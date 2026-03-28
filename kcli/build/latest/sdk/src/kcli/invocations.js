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

    if (!binding.expects_value) {
        if (hasAliasPresetTokens(aliasBinding)) {
            setError(
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
        setError(optionToken, `option '${optionToken}' requires a value`);
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
            setError(invocation.option, formatOptionErrorMessage(invocation.option, message));
        }
    }
}

module.exports = {
    executeInvocations,
    scheduleInvocation,
    schedulePositionals,
};
