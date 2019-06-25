import { getScmInfo } from '../src/get-scm-info';
import { SCMType } from '../src/types';

jest.mock('../src/exec-promise');

const validSourceFixtures: {
  [key: string]: {
    type: SCMType;
    url: string;
  };
} = {
  'robcresswell/dems-example-1': {
    type: 'github',
    url: 'https://github.com/robcresswell/dems-example-1',
  },
  'github:robcresswell/dems-example-2': {
    type: 'github',
    url: 'https://github.com/robcresswell/dems-example-2',
  },
  'https://github.com/robcresswell/dems-example-3': {
    type: 'github',
    url: 'https://github.com/robcresswell/dems-example-3',
  },
  'git@github.com:robcresswell/dems-example-4.git': {
    type: 'github',
    url: 'https://github.com/robcresswell/dems-example-4',
  },
  'gitlab:robcresswell/dems-example-5': {
    type: 'gitlab',
    url: 'https://gitlab.com/robcresswell/dems-example-5',
  },
  'https://gitlab.com/robcresswell/dems-example-6': {
    type: 'gitlab',
    url: 'https://gitlab.com/robcresswell/dems-example-6',
  },
  'git@gitlab.com:robcresswell/dems-example-7.git': {
    type: 'gitlab',
    url: 'https://gitlab.com/robcresswell/dems-example-7',
  },
  'bitbucket:robcresswell/dems-example-8': {
    type: 'bitbucket',
    url: 'https://bitbucket.org/robcresswell/dems-example-8',
  },
  'https://bitbucket.org/robcresswell/dems-example-9': {
    type: 'bitbucket',
    url: 'https://bitbucket.org/robcresswell/dems-example-9',
  },
};

describe('get-scm-info', () => {
  describe('parses SCM info correctly', () => {
    Object.entries(validSourceFixtures).forEach(([sourceUrl, sourceInfo]) => {
      it(sourceUrl, () => {
        const { type, url } = getScmInfo(sourceUrl);

        expect(type).toEqual(sourceInfo.type);
        expect(url).toEqual(sourceInfo.url);
      });
    });
  });

  describe('throws an error if the source is invalid', () => {
    it('throws an error if an empty source is provided', () => {
      expect(() => getScmInfo('')).toThrow();
    });

    it('throws an error if there is no "/"', () => {
      expect(() => getScmInfo('nonsense')).toThrow();
    });

    it('throws an error if the project name is missing', () => {
      expect(() => getScmInfo('partial/')).toThrow();
    });

    it('throws an error if the user or org name is missing', () => {
      expect(() => getScmInfo('/partial')).toThrow();
    });
  });
});
