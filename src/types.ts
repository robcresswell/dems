export type SCMType = 'github' | 'gitlab' | 'bitbucket';

export interface Config {
  resolvedDest: string;
  archiveUrl: string;
}

export interface CommitSHAMap {
  [key: string]: string;
}

export interface Question {
  comment?: string;
  variable: string;
  type: 'variable' | ' section';
}
