"use strict";

const { loadKcli } = require("./deps");

function createTraceExamplesText(root) {
    return (
        "\nGeneral trace selector pattern:\n" +
        `  --${root} <namespace>.<channel>[.<subchannel>[.<subchannel>]]\n\n` +
        "Trace selector examples:\n" +
        `  --${root} '.abc'           Select local 'abc' in current namespace\n` +
        `  --${root} '.abc.xyz'       Select local nested channel in current namespace\n` +
        `  --${root} 'otherapp.channel' Select explicit namespace channel\n` +
        `  --${root} '*.*'            Select all <namespace>.<channel> channels\n` +
        `  --${root} '*.*.*'          Select all channels up to 2 levels\n` +
        `  --${root} '*.*.*.*'        Select all channels up to 3 levels\n` +
        `  --${root} 'alpha.*'        Select all top-level channels in alpha\n` +
        `  --${root} 'alpha.*.*'      Select all channels in alpha (up to 2 levels)\n` +
        `  --${root} 'alpha.*.*.*'    Select all channels in alpha (up to 3 levels)\n` +
        `  --${root} '*.net'          Select 'net' across all namespaces\n` +
        `  --${root} '*.scheduler.tick' Select 'scheduler.tick' across namespaces\n` +
        `  --${root} '*.net.*'        Select subchannels under 'net' across namespaces\n` +
        `  --${root} '*.{net,io}'     Select 'net' and 'io' across all namespaces\n` +
        `  --${root} '{alpha,beta}.*' Select all top-level channels in alpha and beta\n` +
        `  --${root} alpha.net\n` +
        `  --${root} beta.scheduler.tick\n` +
        `  --${root} alpha.net,beta.io\n` +
        `  --${root} gamma.physics.*\n` +
        `  --${root} gamma.physics.*.*\n` +
        `  --${root} alpha.{net,cache}\n` +
        `  --${root} beta.{io,scheduler}.packet\n` +
        `  --${root} '{alpha,beta}.net'\n\n`
    );
}

function createTraceInlineParser({ logger, localTraceLogger, traceRoot, colorNames }) {
    const kcli = loadKcli(__filename);
    const parser = new kcli.InlineParser(traceRoot);
    const localNamespace = localTraceLogger.getNamespace();

    parser.setRootValueHandler((context, value) => {
        void context;
        logger.enableChannels(value, localNamespace);
    }, "<channels>", "Trace selected channels.");

    parser.setHandler("-examples", (context) => {
        process.stdout.write(createTraceExamplesText(context.root));
    }, "Show selector examples.");

    parser.setHandler("-namespaces", () => {
        const namespaces = logger.getNamespaces();
        if (!namespaces.length) {
            process.stdout.write("No trace namespaces defined.\n\n");
            return;
        }
        process.stdout.write("\nAvailable trace namespaces:\n");
        for (const traceNamespace of namespaces) {
            process.stdout.write(`  ${traceNamespace}\n`);
        }
        process.stdout.write("\n");
    }, "Show initialized trace namespaces.");

    parser.setHandler("-channels", () => {
        const namespaces = logger.getNamespaces();
        if (!namespaces.length) {
            process.stdout.write("No trace channels defined.\n\n");
            return;
        }
        process.stdout.write("\nAvailable trace channels:\n");
        for (const traceNamespace of namespaces) {
            for (const channelName of logger.getChannels(traceNamespace)) {
                process.stdout.write(`  ${traceNamespace}.${channelName}\n`);
            }
        }
        process.stdout.write("\n");
    }, "Show initialized trace channels.");

    parser.setHandler("-colors", () => {
        process.stdout.write("\nAvailable trace colors:\n");
        for (const colorName of colorNames) {
            process.stdout.write(`  ${colorName}\n`);
        }
        process.stdout.write("\n");
    }, "Show available trace colors.");

    parser.setHandler("-files", () => {
        const options = logger.getOutputOptions();
        options.filenames = true;
        options.lineNumbers = true;
        logger.setOutputOptions(options);
    }, "Include source file and line in trace output.");

    parser.setHandler("-functions", () => {
        const options = logger.getOutputOptions();
        options.functionNames = true;
        logger.setOutputOptions(options);
    }, "Include function names in trace output.");

    parser.setHandler("-timestamps", () => {
        const options = logger.getOutputOptions();
        options.timestamps = true;
        logger.setOutputOptions(options);
    }, "Include timestamps in trace output.");

    return parser;
}

module.exports = {
    createTraceExamplesText,
    createTraceInlineParser,
};
