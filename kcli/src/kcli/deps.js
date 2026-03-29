"use strict";

const fs = require("node:fs");
const path = require("node:path");

function packageEnvKey(packageName) {
    return `KTOOLS_JS_SDK_ROOT_${String(packageName)
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "_")}`;
}

function resolvePackageFromEnv(packageName) {
    const sdkRoot = process.env[packageEnvKey(packageName)];
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
        const packagePath = path.join(current, "src", "kcli");
        if (fs.existsSync(packagePath)) {
            return current;
        }
        if (path.dirname(current) === current) {
            break;
        }
        current = path.dirname(current);
    }
    throw new Error("unable to locate repository root for kcli sources");
}

function loadKcli(currentFile) {
    const envPath = resolvePackageFromEnv("kcli");
    if (envPath) {
        return require(envPath);
    }
    const repoRoot = findRepoRoot(currentFile);
    return require(path.join(repoRoot, "src", "kcli"));
}

module.exports = {
    findRepoRoot,
    loadKcli,
    packageEnvKey,
    resolvePackageFromEnv,
};
