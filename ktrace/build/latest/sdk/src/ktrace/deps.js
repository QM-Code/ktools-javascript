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
        const srcPath = path.join(current, "src");
        const demoPath = path.join(current, "demo");
        if (fs.existsSync(srcPath) && fs.existsSync(demoPath)) {
            return current;
        }
        if (path.dirname(current) === current) {
            break;
        }
        current = path.dirname(current);
    }
    throw new Error("unable to locate repository root");
}

function loadKcli(currentFile) {
    return loadPackage(currentFile, "kcli");
}

function loadPackage(currentFile, packageName) {
    const envPath = resolvePackageFromEnv(packageName);
    if (envPath) {
        return require(envPath);
    }
    const repoRoot = findRepoRoot(currentFile);
    if (packageName === "ktrace") {
        return require(path.join(repoRoot, "src", "ktrace"));
    }
    if (packageName === "kcli") {
        return require(path.join(repoRoot, "..", "kcli", "src", "kcli"));
    }
    throw new Error(`unsupported package '${packageName}'`);
}

module.exports = {
    findRepoRoot,
    loadKcli,
    loadPackage,
    packageEnvKey,
    resolvePackageFromEnv,
};
