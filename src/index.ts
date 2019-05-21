#! /usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync } from 'fs';
import { resolve } from 'path';
import { logError, logDebug } from './log';
import {
  MissingSourceArgError,
  UnsupportedScmError,
  InvalidSourceError,
  DestExistsError,
} from './errors';
import { get } from 'https';
import { createGunzip } from 'zlib';
import { extract, Headers } from 'tar-fs';
import { ReadStream } from 'fs';
import { parse } from 'mustache';
import { createInterface } from 'readline';
import { walkAndRender } from './walk';

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

const help = `
dems is a scaffolding tool that uses Git and Mustache templating

  $ npx dems user/repo

You may also pass in an alternate destination to clone to

  $ npx dems user/repo target
`;

interface IMustacheTemplate extends Array<string[]> {
  [index: number]: string[];
}

class Template {
  url: string;
  dest: string;
  type: string;
  templateVariables: Set<string>;
  targetHash?: string;
  archiveUrl?: string;

  constructor(args: string[]) {
    const [url, dest] = args;
    this.templateVariables = new Set();
    this.url = url;

    logDebug('Checking source is supplied');
    if (typeof url === 'undefined') {
      throw new MissingSourceArgError();
    }

    logDebug('Checking source is supported');
    const supportedScm = Array.from(scm.keys());
    const isSupportedScm = supportedScm.some((name) => url.includes(name));
    if (!isSupportedScm) {
      throw new UnsupportedScmError();
    }

    logDebug('Checking source is valid');
    const sourceRegex = /^(?:https:\/\/([^/]+)\/|git@([^/]+):|([^/]+):)?([^/\s]+)\/([^/\s#]+)(?:#(.+))?/;
    const validSource = sourceRegex.exec(url);
    if (!validSource) {
      throw new InvalidSourceError();
    }
    logDebug(`Valid source: ${url}`);

    this.type = (
      validSource[1] ||
      validSource[2] ||
      validSource[3] ||
      'github'
    ).replace(/\.(com|org)$/, '');

    logDebug('Checking dest is valid');
    this.dest = dest || url.split('/').pop()!;
    if (existsSync(resolve(this.dest))) {
      throw new DestExistsError();
    }
    logDebug(`Valid dest: ${this.dest}`);
  }

  private getTemplateVariables(fileStream: ReadStream) {
    const templateChunks: string[] = [];

    fileStream.on('data', (chunk) => templateChunks.push(chunk.toString()));
    fileStream.on('end', () => {
      const template: IMustacheTemplate = parse(templateChunks.join(''));
      template
        .filter((entry) => entry[0] !== 'text')
        .map((entry) => entry[1])
        .forEach((entry) => this.templateVariables.add(entry));
    });

    return fileStream;
  }

  private map(header: Headers) {
    header.name = header.name
      .split('/')
      .slice(1)
      .join('/');
    return header;
  }

  private mapStream = (fileStream: ReadStream, { type }: Headers) => {
    if (type === 'file') {
      return this.getTemplateVariables(fileStream);
    }

    return fileStream;
  };

  public async fetchRepo() {
    return new Promise((resolve, reject) => {
      get(this.archiveUrl!, (response) => {
        if (!response.statusCode || response.statusCode >= 400) {
          reject(new Error(response.statusMessage));
        } else if (response.statusCode >= 300) {
          if (typeof response.headers.location === 'undefined') {
            reject(
              new Error(
                `Received redirect code ${response.statusCode}, but headers are missing a "location" key`,
              ),
            );
          }

          this.archiveUrl = response.headers.location;
          this.fetchRepo().then(resolve, reject);
        } else {
          response
            .pipe(createGunzip())
            .pipe(
              extract(this.dest, {
                map: this.map,
                mapStream: this.mapStream,
              }),
            )
            .on('finish', resolve)
            .on('error', reject);
        }
      });
    });
  }

  public async getHash() {
    logDebug('Retrieving hash');
    const { stdout } = await pExec(`git ls-remote ${this.url}`);
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

    this.archiveUrl = scm.get(this.type)!(this.url, hash);
    logDebug(`Archive URL: ${this.archiveUrl}`);
  }
}

async function prompt(question: string): Promise<string> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`${question}: `, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function main() {
  const args = process.argv.slice(2);

  if (args[0] === '--help' || args[0] === '-h') {
    console.info(help);
    process.exit(0);
  }

  try {
    const template = new Template(args);

    await template.getHash();
    await template.fetchRepo();

    if (template.templateVariables.size > 0) {
      const variables: { [key: string]: string } = {};
      const questions = Array.from(template.templateVariables);

      for (let i = 0; i < questions.length; i++) {
        const question = questions[i];
        const answer = await prompt(question);
        variables[question] = answer;
      }

      logDebug(JSON.stringify(variables, null, 2));

      walkAndRender(resolve(template.dest), variables);
    }
  } catch ({ code, message }) {
    logError(message);
    process.exit(code);
  }
}

main();
