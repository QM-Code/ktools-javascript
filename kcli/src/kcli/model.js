"use strict";

class HandlerContext {
    constructor({
        root = "",
        option = "",
        command = "",
        value_tokens = [],
    } = {}) {
        this.root = root;
        this.option = option;
        this.command = command;
        this.value_tokens = Array.from(value_tokens);
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
        expects_value: false,
        flag_handler: null,
        value_handler: null,
        value_arity: ValueArity.REQUIRED,
        description: "",
    };
}

function createAliasBinding() {
    return {
        alias: "",
        target_token: "",
        preset_tokens: [],
    };
}

function createInlineParserData() {
    return {
        root_name: "",
        root_value_handler: null,
        root_value_placeholder: "",
        root_value_description: "",
        commands: [],
    };
}

function createParserData() {
    return {
        positional_handler: null,
        aliases: [],
        commands: [],
        inline_parsers: [],
    };
}

function createParseOutcome() {
    return {
        ok: true,
        error_option: "",
        error_message: "",
    };
}

function createCollectedValues(optionIndex) {
    return {
        has_value: false,
        parts: [],
        last_index: optionIndex,
    };
}

const InvocationKind = Object.freeze({
    FLAG: "flag",
    VALUE: "value",
    POSITIONAL: "positional",
    PRINT_HELP: "print_help",
});

function createInvocation() {
    return {
        kind: InvocationKind.FLAG,
        root: "",
        option: "",
        command: "",
        value_tokens: [],
        flag_handler: null,
        value_handler: null,
        positional_handler: null,
        help_rows: [],
    };
}

const InlineTokenKind = Object.freeze({
    NONE: "none",
    BARE_ROOT: "bare_root",
    DASH_OPTION: "dash_option",
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
