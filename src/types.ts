export type SCMType = 'github' | 'gitlab' | 'bitbucket';

export interface Config {
  resolvedDest: string;
  archiveUrl: string;
  ignoreGlobs: string[];
}

export interface CommitSHAMap {
  [key: string]: string;
}
