import * as readline from 'node:readline';
import * as fs from 'node:fs';

import { debug, error, getInput, notice, setFailed } from '@actions/core';
import { exec } from '@actions/exec';
import { create as glob } from '@actions/glob';
import { which } from '@actions/io';

// Function that returns a generator over the lines of a file
async function* fileLines(file: fs.ReadStream): AsyncGenerator<string> {
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
export async function main(): Promise<void> {
  try {
    const libraries: Map<string, string> = new Map<string, string>();
    const parsedInput = JSON.parse(getInput('libraries')) as Record<string, string | number>;
    const entries = Object.entries<string | number>(parsedInput);
    for (const [k, v] of entries) {
      debug(`Updating library '${k}' with version '${v}'`);
      libraries.set(k, typeof v === 'string' ? v : `${v}`);
    }
    const libraryNames: string[] = Array.from(libraries.keys());
    const toUpdate: Map<string, string[]> = new Map<string, string[]>();

    // Initialize the map with the libraries to update
    for (const lib of libraryNames) {
      toUpdate.set(lib, []);
    }

    // Look for *.csproj files that reference one of these libraries
    for await (const projFile of (await glob('**/*.csproj')).globGenerator()) {
      const readStream = fs.createReadStream(projFile);
      for await (const line of fileLines(readStream)) {
        for (const lib of libraryNames) {
          if (line.includes(`Include="${lib}"`)) {
            debug(`Found ${projFile} that references ${lib}`);
            toUpdate.get(lib)?.push(projFile);
          }
        }
      }
    }

    let noUpdates = true;
    for (const updates of toUpdate.values()) {
      if (updates.length > 0) {
        noUpdates = false;
        break;
      }
    }

    if (noUpdates) {
      notice('No libraries to update');
      return;
    }

    // Find dotnet path
    const dotnetPath = await which('dotnet', true);

    // Update the libraries
    for (const [lib, projFiles] of toUpdate) {
      debug(`Updating ${lib} in ${JSON.stringify(projFiles)}`);
      for (const proj of projFiles) {
        const libVersion = libraries.get(lib);
        if (libVersion === undefined) {
          error(`Could not find version for ${lib}`);
          continue;
        }
        const exitCode = await exec(`${dotnetPath}`, ['add', proj, 'package', lib, '--version', libVersion]);
        if (exitCode !== 0) {
          error(`Error updating ${lib} in ${proj}`);
          setFailed(`Error updating ${lib} in ${proj}`);
          return;
        }
      }
    }
  } catch (e) {
    // Fail the workflow run if an error occurs
    if (e instanceof Error) {
      error(e);
      setFailed(e.message);
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main();
