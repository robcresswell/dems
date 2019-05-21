import { InvalidSourceError } from './errors';
import { SCMType } from './types';

export function getScmInfo(url: string): { type: SCMType; repo: string } {
  const pattern = /(?:https:\/\/|git@)?(github|bitbucket|gitlab)?(?::)?(?:\.org|\.com)?(?:\/|:)?([\w-]+\/[\w-]+)(?:\.git)?/;
  const match = url.match(pattern);

  if (!match) {
    throw new InvalidSourceError();
  }

  return {
    type: (match[1] || 'github') as SCMType,
    repo: match[2],
  };
}
