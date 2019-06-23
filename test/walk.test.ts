import { promises as fsp } from 'fs';
import { mocked } from 'ts-jest/utils';
import { walkAndRender } from '../src/walk';

describe('walk', () => {
  fsp.writeFile = jest.fn();
  const writeMock = mocked(fsp.writeFile);

  beforeEach(() => {
    writeMock.mockResolvedValue();
  });

  afterEach(() => {
    writeMock.mockRestore();
  });

  it('renders a tree structure', async () => {
    const templateVariables = {
      name: 'foo',
      title: 'bar',
    };
    await walkAndRender('./test/fixtures/test-dir', templateVariables);

    expect(writeMock).toHaveBeenCalledTimes(2);
    expect(writeMock).toHaveBeenNthCalledWith(
      1,
      'test/fixtures/test-dir/file.txt',
      'foo',
    );
    expect(writeMock).toHaveBeenNthCalledWith(
      2,
      'test/fixtures/test-dir/nested/file2.txt',
      'bar',
    );
  });
});
