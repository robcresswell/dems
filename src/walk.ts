import { render } from 'mustache';
import { promises as fsp } from 'fs';
import { join } from 'path';
import { debug } from './log';

export async function walkAndRender(
  dir: string,
  templateVariables: { [key: string]: string },
) {
  const files = await fsp.readdir(dir, { withFileTypes: true });

  await Promise.all(
    files.map(async (file) => {
      const filePath = join(dir, file.name);

      if (file.isDirectory()) {
        return walkAndRender(filePath, templateVariables);
      }

      if (file.isFile()) {
        const fileToRender = await fsp.readFile(filePath, { encoding: 'utf8' });
        debug(`Writing file ${filePath}`);
        return fsp.writeFile(filePath, render(fileToRender, templateVariables));
      }

      return Promise.resolve();
    }),
  );
}
