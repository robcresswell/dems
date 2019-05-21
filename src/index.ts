// import dot from "dot";
// import tar from "tar";
import mri from "mri";
import { get } from "https";
import { exec } from "child_process";
import { promisify } from "util";
import { existsSync, createWriteStream } from "fs";
import { resolve } from "path";

import { logError, logDebug } from "./log";
import {
  MissingSourceArgError,
  UnsupportedScmError,
  InvalidSourceError,
  DestExistsError
} from "./errors";

const pExec = promisify(exec);

const scm = new Map([
  [
    "gitlab",
    (url: string, hash: string) =>
      `${url}/repository/archive.tar.gz?ref=${hash}`
  ],
  ["bitbucket", (url: string, hash: string) => `${url}/get/${hash}.tar.gz`],
  ["github", (url: string, hash: string) => `${url}/archive/${hash}.tar.gz`]
]);

async function getHash(source: string) {
  logDebug("Retrieving hash");
  const lsRemote = await pExec(`git ls-remote ${source}`);
  const hashRefMap = lsRemote.stdout
    .split("\n")
    .filter(Boolean)
    .map(hashRef => hashRef.split("\t"))
    .reduce(
      (acc, [hash, ref]) => {
        acc[ref] = hash;
        return acc;
      },
      {} as { [key: string]: string }
    );

  const hash = hashRefMap.HEAD;
  logDebug(`Hash: ${hash}`);

  return hash;
}

function getAndWriteSource(url: string, dest: string) {
  logDebug(`Writing from ${url} to ${dest}/`);

  return new Promise((resolve, reject) => {
    get(url, response => {
      const code = response.statusCode;
      if (!code || code >= 400) {
        reject({ code, message: response.statusMessage });
      } else if (code >= 300) {
        getAndWriteSource(response.headers.location!, dest).then(
          resolve,
          reject
        );
      } else {
        response
          .pipe(createWriteStream(dest))
          .on("finish", () => resolve())
          .on("error", reject);
      }
    }).on("error", reject);
  });
}

async function main() {
  const args = mri(process.argv.slice(2));

  try {
    // Check that we have a source arg
    logDebug("Checking source is supplied");
    const source = args._[0];
    if (typeof source === "undefined") {
      throw new MissingSourceArgError();
    }

    // Check that the source is for a supported site
    logDebug("Checking source is supported");
    const supportedScm = Array.from(scm.keys());
    const isSupportedScm = supportedScm.some(name => source.includes(name));
    if (!isSupportedScm) {
      throw new UnsupportedScmError();
    }

    // Check that the source arg appears to be constructed in a valid format
    logDebug("Checking source is valid format");
    const sourceRegex = /^(?:https:\/\/([^/]+)\/|git@([^/]+):|([^/]+):)?([^/\s]+)\/([^/\s#]+)(?:#(.+))?/;
    const isValidSource = sourceRegex.test(source);
    if (!isValidSource) {
      throw new InvalidSourceError();
    }
    logDebug(`Valid source: ${source}`);

    // Check if we have a custom dest arg, and if so, validate it
    logDebug("Checking dest is valid");
    const dest = args._[1] || source.split("/").pop()!;
    if (existsSync(resolve(dest))) {
      throw new DestExistsError();
    }
    logDebug(`Valid dest: ${dest}`);

    const hash = await getHash(source);

    const url = scm.get("github")!(source, hash);

    const file = await getAndWriteSource(url, dest);
    console.log(file);

    // Fetch the source and write it to disk
  } catch ({ code, message }) {
    logError(message);
    process.exit(code);
  }
}

main();
