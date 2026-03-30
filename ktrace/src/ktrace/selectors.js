"use strict";

function trimWhitespace(value) {
    return String(value).trim();
}

function isIdentifier(value) {
    return /^[A-Za-z_][A-Za-z0-9_]*$/.test(String(value));
}

function isValidChannelPath(value) {
    const token = trimWhitespace(value);
    if (!token) {
        return false;
    }
    return token.split(".").every(isIdentifier);
}

function splitByTopLevelCommas(value) {
    const parts = [];
    let start = 0;
    let depth = 0;
    const text = String(value);
    for (let index = 0; index < text.length; index += 1) {
        const ch = text[index];
        if (ch === "{") {
            depth += 1;
            continue;
        }
        if (ch === "}") {
            if (depth === 0) {
                throw new Error("unmatched '}'");
            }
            depth -= 1;
            continue;
        }
        if (ch === "," && depth === 0) {
            parts.push(trimWhitespace(text.slice(start, index)));
            start = index + 1;
        }
    }
    if (depth !== 0) {
        throw new Error("unmatched '{'");
    }
    parts.push(trimWhitespace(text.slice(start)));
    return parts;
}

function expandBraceExpression(value) {
    const openIndex = value.indexOf("{");
    if (openIndex < 0) {
        return [value];
    }
    let depth = 0;
    let closeIndex = -1;
    for (let index = openIndex; index < value.length; index += 1) {
        const ch = value[index];
        if (ch === "{") {
            depth += 1;
        } else if (ch === "}") {
            depth -= 1;
            if (depth === 0) {
                closeIndex = index;
                break;
            }
        }
    }
    if (closeIndex < 0) {
        throw new Error("unmatched '{'");
    }

    const prefix = value.slice(0, openIndex);
    const suffix = value.slice(closeIndex + 1);
    const inside = value.slice(openIndex + 1, closeIndex);
    const alternatives = splitByTopLevelCommas(inside);
    if (alternatives.length === 0 || alternatives.some((item) => !item)) {
        throw new Error("empty brace alternative");
    }

    const output = [];
    for (const alternative of alternatives) {
        for (const expanded of expandBraceExpression(prefix + alternative + suffix)) {
            output.push(expanded);
        }
    }
    return output;
}

function parseSelectorToken(rawToken, localNamespace) {
    const token = trimWhitespace(rawToken);
    if (!token) {
        throw new Error("<empty>");
    }
    const dotIndex = token.indexOf(".");
    if (dotIndex < 0) {
        throw new Error(`${token} (did you mean '.*'?)`);
    }

    const namespaceToken = token.slice(0, dotIndex);
    const channelPattern = token.slice(dotIndex + 1);
    if (!channelPattern) {
        throw new Error(`${token} (missing channel expression)`);
    }

    let namespaceName = "";
    let anyNamespace = false;
    if (namespaceToken === "*") {
        anyNamespace = true;
    } else if (namespaceToken === "") {
        namespaceName = trimWhitespace(localNamespace);
        if (!isIdentifier(namespaceName)) {
            throw new Error(`${token} (missing namespace)`);
        }
    } else if (isIdentifier(namespaceToken)) {
        namespaceName = namespaceToken;
    } else {
        throw new Error(`${token} (invalid namespace '${namespaceToken}')`);
    }

    const channelTokens = channelPattern.split(".");
    if (channelTokens.some((part) => !part)) {
        throw new Error(`${token} (empty channel token)`);
    }
    for (const part of channelTokens) {
        if (part !== "*" && !isIdentifier(part)) {
            throw new Error(`${token} (invalid channel token '${part}')`);
        }
    }

    return {
        anyNamespace,
        traceNamespace: namespaceName,
        channelTokens,
        display: namespaceToken === "" ? `${namespaceName}.${channelPattern}` : token,
    };
}

function parseSelectorList(selectorsCsv, localNamespace) {
    const selectors = [];
    const rawParts = splitByTopLevelCommas(String(selectorsCsv));
    for (const rawPart of rawParts) {
        if (!rawPart) {
            throw new Error("Invalid trace selector: '<empty>'");
        }
        for (const expanded of expandBraceExpression(rawPart)) {
            try {
                selectors.push(parseSelectorToken(expanded, localNamespace));
            } catch (error) {
                throw new Error(`Invalid trace selector: '${error.message}'`);
            }
        }
    }
    return selectors;
}

function parseQualifiedChannel(qualifiedChannel, localNamespace) {
    const token = trimWhitespace(qualifiedChannel);
    if (!token) {
        throw new Error("trace channel must not be empty");
    }
    if (token.startsWith(".")) {
        const namespaceName = trimWhitespace(localNamespace);
        if (!isIdentifier(namespaceName)) {
            throw new Error("local trace namespace is required for dot-prefixed channels");
        }
        const channelPath = token.slice(1);
        if (!isValidChannelPath(channelPath)) {
            throw new Error(`invalid trace channel '${channelPath}'`);
        }
        return `${namespaceName}.${channelPath}`;
    }

    const dotIndex = token.indexOf(".");
    if (dotIndex < 0) {
        throw new Error(`invalid trace channel '${token}'`);
    }
    const namespaceName = token.slice(0, dotIndex);
    const channelPath = token.slice(dotIndex + 1);
    if (!isIdentifier(namespaceName) || !isValidChannelPath(channelPath)) {
        throw new Error(`invalid trace channel '${token}'`);
    }
    return `${namespaceName}.${channelPath}`;
}

function selectorMatchesQualifiedChannel(selector, qualifiedChannel) {
    const dotIndex = qualifiedChannel.indexOf(".");
    const namespaceName = qualifiedChannel.slice(0, dotIndex);
    const channelTokens = qualifiedChannel.slice(dotIndex + 1).split(".");

    if (!selector.anyNamespace && selector.traceNamespace !== namespaceName) {
        return false;
    }
    if (channelTokens.length > selector.channelTokens.length) {
        return false;
    }
    if (
        channelTokens.length < selector.channelTokens.length &&
        !selector.channelTokens.every((token) => token === "*")
    ) {
        return false;
    }
    for (let index = 0; index < channelTokens.length; index += 1) {
        const selectorToken = selector.channelTokens[index];
        if (selectorToken !== "*" && selectorToken !== channelTokens[index]) {
            return false;
        }
    }
    return true;
}

module.exports = {
    isIdentifier,
    isValidChannelPath,
    parseQualifiedChannel,
    parseSelectorList,
    selectorMatchesQualifiedChannel,
    splitByTopLevelCommas,
    trimWhitespace,
};
