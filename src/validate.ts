import { resolve } from 'path';
import { existsSync } from 'fs';
import { MissingSourceArgError, DestExistsError } from './errors';
import { Config, CommitSHAMap } from './types';
import { pExec } from './exec-promise';
import { debug } from './log';
import { getScmInfo } from './get-scm-info';

const scmArchiveUrls = {
  gitlab: (repo: string, sha: string) =>
    `https://gitlab.com/${repo}/repository/archive.tar.gz?ref=${sha}`,
  bitbucket: (repo: string, sha: string) =>
    `https://bitbucket.org/${repo}/get/${sha}.tar.gz`,
  github: (repo: string, sha: string) =>
    `https://github.com/${repo}/archive/${sha}.tar.gz`,
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
  url?: string,
  dest?: string,
): Promise<Config> {
  debug('Checking source is supplied');
  if (typeof url === 'undefined' || url.length === 0) {
    throw new MissingSourceArgError();
  }

  debug('Checking source is valid');
  const { repo, type } = getScmInfo(url);
  debug(`Valid source: ${url}`);

  const { stdout } = await pExec(`git ls-remote ${url}`);
  const shaRefMap = stdout
    .split('\n')
    .filter(Boolean)
    .map((shaRef) => shaRef.split('\t'))
    .reduce(
      (acc, [sha, ref]) => {
        acc[ref] = sha;
        return acc;
      },
      // eslint-disable-next-line @typescript-eslint/no-object-literal-type-assertion
      {} as CommitSHAMap,
    );

  const sha = shaRefMap.HEAD;
  debug(`SHA: ${sha}`);

  const archiveUrl = scmArchiveUrls[type](repo, sha);
  debug(`Archive URL: ${archiveUrl}`);

  debug('Checking dest is valid');
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const resolvedDest = resolve(dest || url.split('/').pop()!);
  if (existsSync(resolvedDest)) {
    throw new DestExistsError();
  }
  debug(`Valid dest: ${resolvedDest}`);

  return { resolvedDest, archiveUrl };
}
