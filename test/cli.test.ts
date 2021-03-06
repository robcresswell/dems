import { mocked } from 'ts-jest/utils';
import { promises as fsp, existsSync } from 'fs';
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
    const specs = [
      ['robcresswell/dems-example'],
      ['github:robcresswell/dems-example'],
      ['https://github.com/robcresswell/dems-example'],
      ['gitlab:robcresswell/dems-example'],
      ['https://gitlab.com/robcresswell/dems-example'],
      ['bitbucket:robcresswell/dems-example'],
      ['https://bitbucket.org/robcresswell/dems-example'],
    ];

    specs.forEach(([url]) => {
      it(`works when passed ${url}`, async () => {
        promptMock.mockResolvedValueOnce('foo');
        promptMock.mockResolvedValueOnce('bar');

        const args = [url];
        const { code } = await cli(args);

        expect(writeMock).toHaveBeenCalledTimes(4);
        expect(writeMock).toHaveBeenCalledWith(
          resolve('dems-example', 'LICENSE.md'),
          expect.any(String),
        );
        expect(writeMock).toHaveBeenCalledWith(
          resolve('dems-example', 'README.md'),
          expect.any(String),
        );
        expect(code).toBe(0);
      });
    });

    it('handles .demsignore files', async () => {
      promptMock.mockResolvedValueOnce('foo');
      promptMock.mockResolvedValueOnce('bar');

      const args = ['robcresswell/dems-fixture-with-ignores'];
      const { code } = await cli(args);

      expect(writeMock).toHaveBeenCalledTimes(4);
      expect(writeMock).toHaveBeenCalledWith(
        resolve('dems-fixture-with-ignores', 'LICENSE.md'),
        expect.any(String),
      );
      expect(writeMock).toHaveBeenCalledWith(
        resolve('dems-fixture-with-ignores', 'README.md'),
        expect.any(String),
      );

      // Assert that this file exists, but was not written to
      const fixtureTestFile = resolve(
        'dems-fixture-with-ignores',
        'test/test-file.js',
      );
      expect(existsSync(fixtureTestFile)).toBe(true);
      expect(writeMock).not.toHaveBeenCalledWith(fixtureTestFile);
      expect(code).toBe(0);
    });
  });
});
