#! /usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync } from 'fs';
import { resolve } from 'path';
import { fetch } from './get';
import { logError, logDebug } from './log';
import {
  MissingSourceArgError,
  UnsupportedScmError,
  InvalidSourceError,
  DestExistsError,
} from './errors';

const pExec = promisify(exec);

const scm = new Map([
  [
    'gitlab',
    (url: string, hash: string) =>
      `${url}/repository/archive.tar.gz?ref=${hash}`,
  ],
  ['bitbucket', (url: string, hash: string) => `${url}/get/${hash}.tar.gz`],
  ['github', (url: string, hash: string) => `${url}/archive/${hash}.tar.gz`],
]);

const help =
`dems

dems is a scaffolding tool that uses Git and Mustache templating

  $ npx dems user/repo

You may also pass in an alternate destination to clone to

  & npx dems user/repo target`;

/**
 * Check that the source arg is supplied, and give a useful error if not
 * @param source
 */
function checkSourceIsSupplied(source: string) {
  logDebug('Checking source is supplied');
  if (typeof source === 'undefined') {
    throw new MissingSourceArgError();
  }
}

/**
 * Check that the source is for a supported site
 * @param source
 */
function checkSourceIsSupported(source: string) {
  logDebug('Checking source is supported');
  const supportedScm = Array.from(scm.keys());
  const isSupportedScm = supportedScm.some((name) => source.includes(name));
  if (!isSupportedScm) {
    throw new UnsupportedScmError();
  }
}

/**
 * Check that the source is valid
 * @param source
 */
function getSourceNameIfValid(source: string) {
  logDebug('Checking source is valid');
  const sourceRegex = /^(?:https:\/\/([^/]+)\/|git@([^/]+):|([^/]+):)?([^/\s]+)\/([^/\s#]+)(?:#(.+))?/;
  const isValidSource = sourceRegex.test(source);
  if (!isValidSource) {
    throw new InvalidSourceError();
  }
  logDebug(`Valid source: ${source}`);
  return source;
}

async function getHash(source: string) {
  logDebug('Retrieving hash');
  const { stdout } = await pExec(`git ls-remote ${source}`);
  const hashRefMap = stdout
    .split('\n')
    .filter(Boolean)
    .map((hashRef) => hashRef.split('\t'))
    .reduce(
      (acc, [hash, ref]) => {
        acc[ref] = hash;
        return acc;
      },
      {} as { [key: string]: string },
    );

  const hash = hashRefMap.HEAD;
  logDebug(`Hash: ${hash}`);

  return hash;
}

async function main() {
  const args = process.argv.slice(2);

  if (args[0] === "--help" || args[0] === "-h") {
    console.log(help);
  }

  const [sourceUrl] = args;

  try {
    checkSourceIsSupplied(sourceUrl);
    checkSourceIsSupported(sourceUrl);
    const source = getSourceNameIfValid(sourceUrl);

    // Check if we have a custom dest arg, and if so, validate it
    logDebug('Checking dest is valid');
    const dest = args[1] || sourceUrl.split('/').pop()!;
    if (existsSync(resolve(dest))) {
      throw new DestExistsError();
    }
    logDebug(`Valid dest: ${dest}`);

    const hash = await getHash(sourceUrl);
    const url = scm.get(source)!(sourceUrl, hash);
    const file = await fetch(url, dest);
    console.log(file);

    // Fetch the source and write it to disk
  } catch ({ code, message }) {
    logError(message);
    process.exit(code);
  }
}

main();
