import { InvalidSourceError } from './errors';
import { SCMType } from './types';

const repoUrlMap = {
  github: (repo: string) => `https://github.com/${repo}`,
  gitlab: (repo: string) => `https://gitlab.com/${repo}`,
  bitbucket: (repo: string) => `https://bitbucket.org/${repo}`,
};

export function getScmInfo(descriptor: string): { type: SCMType; url: string } {
  const pattern = /(?:https:\/\/|git@)?(github|bitbucket|gitlab)?(?::)?(?:\.org|\.com)?(?:\/|:)?([\w-]+\/[\w-]+)(?:\.git)?/;
  const match = descriptor.match(pattern);

  if (!match) {
    throw new InvalidSourceError();
  }

  const type = (match[1] || 'github') as SCMType;
  const url = repoUrlMap[type](match[2]);

  return { type, url };
}
