"use strict";

class HandlerContext {
    constructor({
        root = "",
        option = "",
        command = "",
        valueTokens = [],
    } = {}) {
        this.root = root;
        this.option = option;
        this.command = command;
        this.valueTokens = Array.from(valueTokens);
    }
}

class CliError extends Error {
    constructor(option, message) {
        super(message || "kcli parse failed");
        this.name = "CliError";
        this._option = option || "";
    }

    option() {
        return this._option;
    }
}

const ValueArity = Object.freeze({
    REQUIRED: "required",
    OPTIONAL: "optional",
});

function createCommandBinding() {
    return {
        expectsValue: false,
        flagHandler: null,
        valueHandler: null,
        valueArity: ValueArity.REQUIRED,
        description: "",
    };
}

function createAliasBinding() {
    return {
        alias: "",
        targetToken: "",
        presetTokens: [],
    };
}

function createInlineParserData() {
    return {
        rootName: "",
        rootValueHandler: null,
        rootValuePlaceholder: "",
        rootValueDescription: "",
        commands: [],
    };
}

function createParserData() {
    return {
        positionalHandler: null,
        aliases: [],
        commands: [],
        inlineParsers: [],
    };
}

function createParseOutcome() {
    return {
        ok: true,
        errorOption: "",
        errorMessage: "",
    };
}

function createCollectedValues(optionIndex) {
    return {
        hasValue: false,
        parts: [],
        lastIndex: optionIndex,
    };
}

const InvocationKind = Object.freeze({
    FLAG: "flag",
    VALUE: "value",
    POSITIONAL: "positional",
    PRINT_HELP: "printHelp",
});

function createInvocation() {
    return {
        kind: InvocationKind.FLAG,
        root: "",
        option: "",
        command: "",
        valueTokens: [],
        flagHandler: null,
        valueHandler: null,
        positionalHandler: null,
        helpRows: [],
    };
}

const InlineTokenKind = Object.freeze({
    NONE: "none",
    BARE_ROOT: "bareRoot",
    DASH_OPTION: "dashOption",
});

function createInlineTokenMatch() {
    return {
        kind: InlineTokenKind.NONE,
        parser: null,
        suffix: "",
    };
}

module.exports = {
    CliError,
    HandlerContext,
    InlineTokenKind,
    InvocationKind,
    ValueArity,
    createAliasBinding,
    createCollectedValues,
    createCommandBinding,
    createInlineParserData,
    createInlineTokenMatch,
    createInvocation,
    createParseOutcome,
    createParserData,
};
