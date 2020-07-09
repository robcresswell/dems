import { existsSync, rmdirSync, readdirSync, unlinkSync } from 'fs';
import { resolve } from 'path';

function deleteDirectory(path: string) {
  if (existsSync(path)) {
    const dirents = readdirSync(path, { withFileTypes: true });
    dirents.forEach((ent) => {
      if (ent.isFile()) {
        unlinkSync(resolve(path, ent.name));
      }

      if (ent.isDirectory()) {
        deleteDirectory(resolve(path, ent.name));
      }
    });

    rmdirSync(path);
  }
}

/**
 * Not an ideal solution, but relatively safe if the tests are not executed in
 * parallel, and provides an easier solution than mocking write streams. Note
 * that due to performance issues with Jest and parallelism in CircleCI,
 * --runInBand is recommended anyway.
 */
export function removeTestDir(): void {
  const fixturePaths = ['dems-example', 'dems-fixture-with-ignores'];

  fixturePaths.forEach((fixturePath) => {
    const dir = resolve(fixturePath);
    deleteDirectory(dir);
  });
}
