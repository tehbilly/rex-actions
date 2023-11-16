"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = void 0;
const readline = __importStar(require("node:readline"));
const fs = __importStar(require("node:fs"));
const core_1 = require("@actions/core");
const exec_1 = require("@actions/exec");
const glob_1 = require("@actions/glob");
const io_1 = require("@actions/io");
// Function that returns a generator over the lines of a file
async function* fileLines(file) {
    const reader = readline.createInterface({
        input: file,
        crlfDelay: Infinity,
    });
    for await (const line of reader) {
        yield line;
    }
}
/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
async function main() {
    try {
        const libraries = new Map();
        for (const [k, v] of Object.entries(JSON.parse((0, core_1.getInput)('libraries')))) {
            (0, core_1.debug)(`Updating library '${k}' with version '${v}'`);
            libraries.set(k, typeof v === 'string' ? v : `${v}`);
        }
        const libraryNames = Array.from(libraries.keys());
        (0, core_1.debug)(`Library names: ${libraryNames}`);
        const toUpdate = new Map();
        // Initialize the map with the libraries to update
        for (let lib of libraryNames) {
            toUpdate.set(lib, []);
        }
        // Look for *.csproj files that reference one of these libraries
        for await (const projFile of (await (0, glob_1.create)('**/*.csproj')).globGenerator()) {
            const readStream = fs.createReadStream(projFile);
            for await (const line of fileLines(readStream)) {
                for (let lib of libraryNames) {
                    if (line.includes(lib)) {
                        (0, core_1.debug)(`Found ${projFile} that references ${lib}`);
                        toUpdate.get(lib).push(projFile);
                    }
                }
            }
        }
        let noUpdates = true;
        for (let updates of toUpdate.values()) {
            if (updates.length > 0) {
                noUpdates = false;
                break;
            }
        }
        if (noUpdates) {
            (0, core_1.notice)('No libraries to update');
            return;
        }
        // Find dotnet path
        const dotnetPath = await (0, io_1.which)('dotnet', true);
        // Update the libraries
        for (const [lib, projFiles] of toUpdate) {
            (0, core_1.debug)(`Updating ${lib} in ${projFiles}`);
            for (const proj of projFiles) {
                const exitCode = await (0, exec_1.exec)(`${dotnetPath}`, [
                    'add',
                    proj,
                    'package',
                    lib,
                    '--version',
                    libraries.get(lib),
                ]);
                if (exitCode !== 0) {
                    (0, core_1.error)(`Error updating ${lib} in ${proj}`);
                    (0, core_1.setFailed)(`Error updating ${lib} in ${proj}`);
                    return;
                }
            }
        }
    }
    catch (e) {
        // Fail the workflow run if an error occurs
        if (e instanceof Error) {
            (0, core_1.error)(e);
            (0, core_1.setFailed)(e.message);
        }
    }
}
exports.main = main;
// eslint-disable-next-line @typescript-eslint/no-floating-promises
main();
//# sourceMappingURL=main.js.map