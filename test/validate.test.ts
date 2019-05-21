import { mocked } from 'ts-jest/utils';
import { getValidConfig } from '../src/validate';
import { pExec } from '../src/exec-promise';

jest.mock('../src/exec-promise');

describe('validate', () => {
  const url = 'https://github.com/robcresswell/dems-example';
  const sha = '0efcb30d0a12d6f00ff476aec0642cb6253d7a90';
  const ref = 'HEAD';
  const pExecMock = mocked(pExec);
  pExecMock.mockImplementation(async () => ({
    stdout: `${sha}\t${ref}\n`,
    stderr: '',
  }));

  it('retrieves an archive URL to download', async () => {
    const { archiveUrl } = await getValidConfig(url);

    expect(pExecMock).toHaveBeenCalledTimes(1);
    expect(pExecMock).toHaveBeenCalledWith(
      'git ls-remote https://github.com/robcresswell/dems-example',
    );
    expect(archiveUrl).toBe(
      'https://github.com/robcresswell/dems-example/archive/0efcb30d0a12d6f00ff476aec0642cb6253d7a90.tar.gz',
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
