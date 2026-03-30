"use strict";

const {
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
} = require("./internal/backend");
const {
    CliError,
    HandlerContext,
    createInlineParserData,
    createParserData,
} = require("./internal/model");
const {
    classifySetHandler,
    reportCliErrorAndExit,
    validateHandlerArity,
} = require("./internal/normalize");
const { parse } = require("./internal/process");

function normalizeArgv(argv) {
    if (argv == null) {
        throw new Error("kcli parse requires argv");
    }
    if (!Number.isInteger(argv.length) || argv.length < 0) {
        throw new Error("kcli parse requires argv with a non-negative length");
    }
    return argv;
}

class InlineParser {
    constructor(root) {
        this._data = createInlineParserData();
        setInlineRoot(this._data, root);
    }

    setRoot(root) {
        setInlineRoot(this._data, root);
    }

    setRootValueHandler(handler, valuePlaceholder, description) {
        if (valuePlaceholder === undefined && description === undefined) {
            setRootValueHandler(this._data, handler);
            return;
        }
        if (valuePlaceholder === undefined || description === undefined) {
            throw new Error(
                "kcli root value handler help metadata requires both a placeholder and description"
            );
        }
        setRootValueHandlerWithHelp(this._data, handler, valuePlaceholder, description);
    }

    setHandler(option, handler, description) {
        const kind = classifySetHandler(handler);
        if (kind === "flag") {
            setInlineHandlerFlag(this._data, option, handler, description);
            return;
        }
        setInlineHandlerValue(this._data, option, handler, description);
    }

    setOptionalValueHandler(option, handler, description) {
        validateHandlerArity(handler, 2, "kcli value handler must not be empty");
        setInlineOptionalValueHandler(this._data, option, handler, description);
    }
}

class Parser {
    constructor() {
        this._data = createParserData();
    }

    addAlias(alias, target, presetTokens) {
        setAlias(this._data, alias, target, presetTokens || []);
    }

    setHandler(option, handler, description) {
        const kind = classifySetHandler(handler);
        if (kind === "flag") {
            setPrimaryHandlerFlag(this._data, option, handler, description);
            return;
        }
        setPrimaryHandlerValue(this._data, option, handler, description);
    }

    setOptionalValueHandler(option, handler, description) {
        validateHandlerArity(handler, 2, "kcli value handler must not be empty");
        setPrimaryOptionalValueHandler(this._data, option, handler, description);
    }

    setPositionalHandler(handler) {
        setPositionalHandler(this._data, handler);
    }

    addInlineParser(parser) {
        addInlineParser(this._data, cloneInlineParserData(parser._data));
    }

    parseOrExit(argv) {
        const normalizedArgv = normalizeArgv(argv);
        try {
            this.parseOrThrow(normalizedArgv);
        } catch (error) {
            if (error instanceof CliError) {
                reportCliErrorAndExit(error.message);
                return;
            }
            throw error;
        }
    }

    parseOrThrow(argv) {
        const normalizedArgv = normalizeArgv(argv);
        parse(this._data, normalizedArgv.length, normalizedArgv);
    }
}

module.exports = {
    CliError,
    HandlerContext,
    InlineParser,
    Parser,
};
