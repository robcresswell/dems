import { mocked } from 'ts-jest/utils';
import { promises as fsp } from 'fs';
import { resolve } from 'path';
import { cli } from '../src/cli';
import { prompt } from '../src/prompt';
import { removeTestDir } from './cleanup';

jest.mock('../src/prompt');

describe('cli', () => {
  fsp.writeFile = jest.fn();
  const promptMock = mocked(prompt);
  const writeMock = mocked(fsp.writeFile);

  beforeEach(() => {
    writeMock.mockResolvedValue();
  });

  afterEach(() => {
    writeMock.mockRestore();
    promptMock.mockReset();
    removeTestDir();
  });

  it('prints help text when passed "-h"', async () => {
    const args = ['-h'];
    const { code, message } = await cli(args);

    expect(code).toBe(0);
    expect(message).toEqual(expect.stringContaining('Usage'));
  });

  it('prints help text when passed "--help"', async () => {
    const args = ['--help'];
    const { code, message } = await cli(args);

    expect(code).toBe(0);
    expect(message).toEqual(expect.stringContaining('Usage'));
  });

  it('propagates error codes and messages', async () => {
    const args = ['not-a-valid-source'];
    const { code, message } = await cli(args);

    expect(code).toBeGreaterThan(0);
    expect(message).toEqual(expect.any(String));
  });

  it('propagates success codes and messages', async () => {
    promptMock.mockResolvedValueOnce('foo');
    promptMock.mockResolvedValueOnce('bar');

    const args = ['github:robcresswell/dems-example'];
    const { code, message } = await cli(args);

    expect(code).toBe(0);
    expect(message.toLowerCase()).toEqual(expect.stringContaining('success'));
  });

  describe('e2e scenarios', () => {
    it('downloads a repo and renders files with user input variables', async () => {
      promptMock.mockResolvedValueOnce('foo');
      promptMock.mockResolvedValueOnce('bar');

      const args = ['github:robcresswell/dems-example'];
      const { code } = await cli(args);

      expect(writeMock).toHaveBeenCalledTimes(4);
      expect(writeMock).toHaveBeenNthCalledWith(
        1,
        resolve('dems-example', 'LICENSE.md'),
        expect.any(String),
      );
      expect(writeMock).toHaveBeenNthCalledWith(
        2,
        resolve('dems-example', 'README.md'),
        expect.any(String),
      );
      expect(code).toBe(0);
    });
  });
});
