import { mocked } from 'ts-jest/utils';
import { cli } from '../src/cli';
import { getValidConfig } from '../src/validate';
import { InvalidSourceError } from '../src/errors';

// mock the parts of the CLI that have side effects on the file system
jest.mock('../src/validate');
jest.mock('../src/download-repo');

describe('cli', () => {
  const validateMock = mocked(getValidConfig);
  afterEach(() => {
    validateMock.mockReset();
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
    validateMock.mockImplementationOnce(async () => {
      throw new InvalidSourceError();
    });
    const args = ['not-a-valid-source'];
    const { code, message } = await cli(args);

    expect(code).toBeGreaterThan(0);
    expect(message).toEqual(expect.any(String));
  });

  it('propagates success codes and messages', async () => {
    validateMock.mockImplementationOnce(async () => {
      return {
        resolvedDest: 'dest',
        archiveUrl: 'https://foo',
      };
    });
    const args = ['github:valid/source'];
    const { code, message } = await cli(args);

    expect(code).toBe(0);
    expect(message.toLowerCase()).toEqual(expect.stringContaining('success'));
  });
});
