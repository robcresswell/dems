import { mocked } from 'ts-jest/utils';
import { getValidConfig } from '../src/validate';
import { pExec } from '../src/exec-promise';

jest.mock('../src/exec-promise');

describe('validate', () => {
  const sha = '0efcb30d0a12d6f00ff476aec0642cb6253d7a90';
  const ref = 'HEAD';
  const pExecMock = mocked(pExec);
  pExecMock.mockImplementation(async () => ({
    stdout: `${sha}\t${ref}\n`,
    stderr: '',
  }));

  afterEach(() => {
    pExecMock.mockClear();
  });

  it('retrieves an archive URL for GitHub', async () => {
    const url = 'https://github.com/robcresswell/dems-example';
    const { archiveUrl } = await getValidConfig(url);

    expect(pExecMock).toHaveBeenCalledTimes(1);
    expect(pExecMock).toHaveBeenCalledWith(
      'git ls-remote https://github.com/robcresswell/dems-example',
    );
    expect(archiveUrl).toBe(
      'https://github.com/robcresswell/dems-example/archive/0efcb30d0a12d6f00ff476aec0642cb6253d7a90.tar.gz',
    );
  });

  it('retrieves an archive URL for GitLab', async () => {
    const url = 'https://gitlab.com/robcresswell/dems-example';
    const { archiveUrl } = await getValidConfig(url);

    expect(pExecMock).toHaveBeenCalledTimes(1);
    expect(pExecMock).toHaveBeenCalledWith(
      'git ls-remote https://gitlab.com/robcresswell/dems-example',
    );
    expect(archiveUrl).toBe(
      'https://gitlab.com/robcresswell/dems-example/repository/archive.tar.gz?ref=0efcb30d0a12d6f00ff476aec0642cb6253d7a90',
    );
  });

  it('retrieves an archive URL for Bitbucket', async () => {
    const url = 'https://bitbucket.org/robcresswell/dems-example';
    const { archiveUrl } = await getValidConfig(url);

    expect(pExecMock).toHaveBeenCalledTimes(1);
    expect(pExecMock).toHaveBeenCalledWith(
      'git ls-remote https://bitbucket.org/robcresswell/dems-example',
    );
    expect(archiveUrl).toBe(
      'https://bitbucket.org/robcresswell/dems-example/get/0efcb30d0a12d6f00ff476aec0642cb6253d7a90.tar.gz',
    );
  });

  it('throws an error if no source is provided', async () => {
    await expect(getValidConfig()).rejects.toThrow();
  });

  describe('with destination directory supplied', () => {
    it('accepts a custom target directory', async () => {
      const { resolvedDest } = await getValidConfig(
        'https://github.com/robcresswell/dems-example',
        'foo',
      );

      expect(resolvedDest).not.toContain('/dems-example');
      expect(resolvedDest).toContain('/foo');
    });

    it('throws an error if the destination directory exists', async () => {
      await expect(
        getValidConfig('https://github.com/robcresswell/dems-example', 'src'),
      ).rejects.toThrow();
    });
  });

  describe('with no destination directory supplied', () => {
    it('determines a default target directory based on the repo name', async () => {
      const { resolvedDest } = await getValidConfig(
        'https://github.com/robcresswell/dems-example',
      );

      expect(resolvedDest).toContain('/dems-example');
    });

    it('throws an error if the destination directory exists', async () => {
      await expect(
        getValidConfig('https://github.com/robcresswell/src'),
      ).rejects.toThrow();
    });
  });
});
