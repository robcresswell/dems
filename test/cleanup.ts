import { existsSync, rmdirSync, readdirSync, unlinkSync } from 'fs';
import { resolve } from 'path';

/**
 * Not an ideal solution, but relatively safe if the tests are not executed in
 * parallel, and provides an easier solution than mocking write streams. Note
 * that due to performance issues with Jest and parallelism in CircleCI,
 * --runInBand is recommended anyway.
 */
export function removeTestDir() {
  const dir = resolve('dems-example');
  if (existsSync(dir)) {
    const dirents = readdirSync(dir, { withFileTypes: true });
    dirents.forEach((ent) => {
      if (ent.isFile()) {
        unlinkSync(resolve(dir, ent.name));
      }
    });

    rmdirSync(dir);
  }
}
