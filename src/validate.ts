import { resolve } from 'path';
import { existsSync } from 'fs';
import {
  MissingSourceArgError,
  DestExistsError,
  InvalidSourceError,
} from './errors';
import { Config, CommitSHAMap, SCMType } from './types';
import { pExec } from './exec-promise';
import { debug } from './log';
import { getGlobsToIgnore } from './get-globs-to-ignore';

const repoUrlMap = {
  github: (repo: string) => `https://github.com/${repo}`,
  gitlab: (repo: string) => `https://gitlab.com/${repo}`,
  bitbucket: (repo: string) => `https://bitbucket.org/${repo}`,
};

const scmArchiveUrls = {
  gitlab: (url: string, sha: string) =>
    `${url}/repository/archive.tar.gz?ref=${sha}`,
  bitbucket: (url: string, sha: string) => `${url}/get/${sha}.tar.gz`,
  github: (url: string, sha: string) => `${url}/archive/${sha}.tar.gz`,
};

const ignoreFileUrls = {
  gitlab: (repo: string, sha: string) =>
    `https://gitlab.com/${repo}/raw/${sha}/.demsignore`,
  bitbucket: (repo: string, sha: string) =>
    `https://bitbucket.org/${repo}/raw/${sha}/.demsignore`,
  github: (repo: string, sha: string) =>
    `https://raw.githubusercontent.com/${repo}/${sha}/.demsignore`,
};

/**
 * Run several checks to see if the user input appears valid. If valid,
 * transform it into a stricter structure for the rest of the program.
 *
 * This is so the user can pass a range of targets, such as `user/repo` or
 * `gitlab:user/repo` etc. for a better UX, but we still get predicatable
 * formats internally.
 *
 * @param url A user input string to download a repo from
 * @param dest A user input target directory
 */
export async function getValidConfig(
  descriptor?: string,
  dest?: string,
): Promise<Config> {
  debug('Checking source is supplied');
  if (typeof descriptor === 'undefined' || descriptor.length === 0) {
    throw new MissingSourceArgError();
  }

  debug('Checking source is valid');
  const pattern = /(?:https:\/\/|git@)?(github|bitbucket|gitlab)?(?::)?(?:\.org|\.com)?(?:\/|:)?([\w-]+\/[\w-]+)(?:\.git)?/;
  const match = descriptor.match(pattern);

  if (!match) {
    throw new InvalidSourceError();
  }

  const type = (match[1] || 'github') as SCMType;
  const repo = match[2];
  const url = repoUrlMap[type](repo);

  debug(`Valid source: ${url}`);

  const { stdout } = await pExec(`git ls-remote ${url}`);
  const shaRefMap = stdout
    .split('\n')
    .filter(Boolean)
    .map((shaRef) => shaRef.split('\t'))
    .reduce((acc, [sha, ref]) => {
      acc[ref] = sha;
      return acc;
    }, {} as CommitSHAMap);

  const sha = shaRefMap.HEAD;
  debug(`SHA: ${sha}`);

  const archiveUrl = scmArchiveUrls[type](url, sha);
  debug(`Archive URL: ${archiveUrl}`);

  const ignoreFileUrl = ignoreFileUrls[type](repo, sha);
  debug(`Ignore file URL: ${ignoreFileUrl}`);

  const ignoreGlobs = await getGlobsToIgnore(ignoreFileUrl);
  debug(`Globs to ignore: ${ignoreGlobs}`);

  debug('Checking dest is valid');
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const resolvedDest = resolve(dest || url.split('/').pop()!);
  if (existsSync(resolvedDest)) {
    throw new DestExistsError();
  }
  debug(`Valid dest: ${resolvedDest}`);

  return { resolvedDest, archiveUrl, ignoreGlobs };
}
