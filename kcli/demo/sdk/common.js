"use strict";

const fs = require("node:fs");
const path = require("node:path");

function packageEnvKey(packageName) {
    return `KTOOLS_JS_SDK_ROOT_${String(packageName)
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "_")}`;
}

function resolvePackageFromEnv(packageName) {
    const envKey = packageEnvKey(packageName);
    const sdkRoot = process.env[envKey];
    if (!sdkRoot) {
        return "";
    }
    const candidate = path.join(sdkRoot, "src", packageName);
    if (!fs.existsSync(candidate)) {
        throw new Error(`configured SDK root for ${packageName} is missing package sources: ${candidate}`);
    }
    return candidate;
}

function findRepoRoot(currentFile) {
    const filePath = path.resolve(currentFile);
    let current = path.dirname(filePath);
    while (true) {
        const srcPath = path.join(current, "src");
        const demoPath = path.join(current, "demo");
        try {
            require("node:fs").accessSync(srcPath);
            require("node:fs").accessSync(demoPath);
            return current;
        } catch (error) {
            if (path.dirname(current) === current) {
                break;
            }
            current = path.dirname(current);
        }
    }
    throw new Error("unable to locate repository root for demo bootstrap");
}

function loadKcli(currentFile) {
    const envPath = resolvePackageFromEnv("kcli");
    if (envPath) {
        return require(envPath);
    }
    const repoRoot = findRepoRoot(currentFile);
    return require(path.join(repoRoot, "src", "kcli"));
}

function printProcessingLine(context, value) {
    if (!context.value_tokens.length) {
        console.log(`Processing ${context.option}`);
        return;
    }
    if (context.value_tokens.length === 1) {
        console.log(`Processing ${context.option} with value "${value}"`);
        return;
    }
    const joined = context.value_tokens.map((token) => `"${token}"`).join(",");
    console.log(`Processing ${context.option} with values [${joined}]`);
}

module.exports = {
    findRepoRoot,
    loadKcli,
    printProcessingLine,
};
