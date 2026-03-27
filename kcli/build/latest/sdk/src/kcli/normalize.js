"use strict";

const { CliError } = require("./model");

function reportCliErrorAndExit(message) {
    const line = process.stderr.isTTY
        ? `[\x1b[31merror\x1b[0m] [\x1b[94mcli\x1b[0m] ${message}\n`
        : `[error] [cli] ${message}\n`;
    process.stderr.write(line);
    process.exit(2);
}

function trimWhitespace(value) {
    return String(value).trim();
}

function containsWhitespace(value) {
    return /\s/.test(value);
}

function startsWith(value, prefix) {
    return String(value).startsWith(prefix);
}

function normalizeRootNameOrThrow(rawRoot) {
    const root = trimWhitespace(rawRoot);
    if (!root) {
        throw new Error("kcli root must not be empty");
    }
    if (root[0] === "-") {
        throw new Error("kcli root must not begin with '-'");
    }
    if (containsWhitespace(root)) {
        throw new Error("kcli root is invalid");
    }
    return root;
}

function normalizeInlineRootOptionOrThrow(rawRoot) {
    let root = trimWhitespace(rawRoot);
    if (!root) {
        throw new Error("kcli root must not be empty");
    }
    if (startsWith(root, "--")) {
        root = root.slice(2);
    } else if (root[0] === "-") {
        throw new Error("kcli root must use '--root' or 'root'");
    }
    return normalizeRootNameOrThrow(root);
}

function normalizeInlineHandlerOptionOrThrow(rawOption, rootName) {
    let option = trimWhitespace(rawOption);
    if (!option) {
        throw new Error("kcli inline handler option must not be empty");
    }
    if (startsWith(option, "--")) {
        const fullPrefix = `--${rootName}-`;
        if (!startsWith(option, fullPrefix)) {
            throw new Error(
                `kcli inline handler option must use '-name' or '${fullPrefix}name'`
            );
        }
        option = option.slice(fullPrefix.length);
    } else if (option[0] === "-") {
        option = option.slice(1);
    } else {
        throw new Error(
            `kcli inline handler option must use '-name' or '--${rootName}-name'`
        );
    }
    if (!option) {
        throw new Error("kcli command must not be empty");
    }
    if (option[0] === "-") {
        throw new Error("kcli command must not start with '-'");
    }
    if (containsWhitespace(option)) {
        throw new Error("kcli command must not contain whitespace");
    }
    return option;
}

function normalizePrimaryHandlerOptionOrThrow(rawOption) {
    let option = trimWhitespace(rawOption);
    if (!option) {
        throw new Error("kcli end-user handler option must not be empty");
    }
    if (startsWith(option, "--")) {
        option = option.slice(2);
    } else if (option[0] === "-") {
        throw new Error("kcli end-user handler option must use '--name' or 'name'");
    }
    if (!option) {
        throw new Error("kcli command must not be empty");
    }
    if (option[0] === "-") {
        throw new Error("kcli command must not start with '-'");
    }
    if (containsWhitespace(option)) {
        throw new Error("kcli command must not contain whitespace");
    }
    return option;
}

function normalizeAliasOrThrow(rawAlias) {
    const alias = trimWhitespace(rawAlias);
    if (
        alias.length < 2 ||
        alias[0] !== "-" ||
        startsWith(alias, "--") ||
        containsWhitespace(alias)
    ) {
        throw new Error("kcli alias must use single-dash form, e.g. '-v'");
    }
    return alias;
}

function normalizeAliasTargetOptionOrThrow(rawTarget) {
    const target = trimWhitespace(rawTarget);
    if (
        target.length < 3 ||
        !startsWith(target, "--") ||
        containsWhitespace(target)
    ) {
        throw new Error("kcli alias target must use double-dash form, e.g. '--verbose'");
    }
    if (target[2] === "-") {
        throw new Error("kcli alias target must use double-dash form, e.g. '--verbose'");
    }
    return target;
}

function normalizeHelpPlaceholderOrThrow(rawPlaceholder) {
    const placeholder = trimWhitespace(rawPlaceholder);
    if (!placeholder) {
        throw new Error("kcli help placeholder must not be empty");
    }
    return placeholder;
}

function normalizeDescriptionOrThrow(rawDescription) {
    const description = trimWhitespace(rawDescription);
    if (!description) {
        throw new Error("kcli command description must not be empty");
    }
    return description;
}

function makeError(option, message) {
    return {
        ok: false,
        error_option: option,
        error_message: message,
    };
}

function throwCliError(result) {
    if (result.ok) {
        throw new Error("kcli internal error: ThrowCliError called without a failure");
    }
    throw new CliError(result.error_option, result.error_message);
}

function validateHandlerArity(handler, minimum, emptyMessage) {
    void minimum;
    if (typeof handler !== "function") {
        throw new Error(emptyMessage);
    }
}

function classifySetHandler(handler) {
    if (typeof handler !== "function") {
        throw new Error("kcli handler must not be empty");
    }
    if (handler.length >= 2) {
        return "value";
    }
    return "flag";
}

module.exports = {
    classifySetHandler,
    containsWhitespace,
    makeError,
    normalizeAliasOrThrow,
    normalizeAliasTargetOptionOrThrow,
    normalizeDescriptionOrThrow,
    normalizeHelpPlaceholderOrThrow,
    normalizeInlineHandlerOptionOrThrow,
    normalizeInlineRootOptionOrThrow,
    normalizePrimaryHandlerOptionOrThrow,
    normalizeRootNameOrThrow,
    reportCliErrorAndExit,
    startsWith,
    throwCliError,
    trimWhitespace,
    validateHandlerArity,
};
