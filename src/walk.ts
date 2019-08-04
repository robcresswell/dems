import { render } from 'mustache';
import { promises as fsp } from 'fs';
import { join, resolve } from 'path';
import minimatch from 'minimatch';
import { debug } from './log';

export async function walkAndRender(
  dir: string,
  templateVariables: { [key: string]: string },
  ignoreGlobs: string[],
) {
  const files = await fsp.readdir(dir, { withFileTypes: true });

  await Promise.all(
    files.map(async (file) => {
      const filePath = join(dir, file.name);

      if (file.isDirectory()) {
        return walkAndRender(filePath, templateVariables, ignoreGlobs);
      }

      if (file.isFile()) {
        if (file.name === '.demsignore') {
          return fsp.unlink(filePath);
        }

        if (ignoreGlobs.some((glob) => minimatch(filePath, resolve(glob)))) {
          return Promise.resolve();
        }

        const fileToRender = await fsp.readFile(filePath, { encoding: 'utf8' });
        debug(`Writing file ${filePath}`);
        return fsp.writeFile(filePath, render(fileToRender, templateVariables));
      }

      return Promise.resolve();
    }),
  );
}
