import { get } from 'https';
import { debug } from './log';

export async function getGlobsToIgnore(
  ignoreFileUrl: string,
): Promise<string[]> {
  let globs: string[] = [];

  return new Promise((resolve) => {
    try {
      get(ignoreFileUrl, (response) => {
        if (response.statusCode !== 200) {
          debug(`No .demsignore file found at ${ignoreFileUrl}`);
          resolve([]);
        }

        const globChunks: string[] = [];

        response.on('data', (chunk) => {
          globChunks.push(chunk);
        });

        response.on('end', () => {
          globs = globChunks
            .join('')
            .split('\n')
            .filter(Boolean);
          resolve(globs);
        });
      });
    } catch {
      debug(`Error retrieving .demsignore file at ${ignoreFileUrl}`);
    }
  });
}
