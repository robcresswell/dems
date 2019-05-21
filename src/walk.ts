import { render } from 'mustache';
import { readdir, writeFileSync } from 'fs';
import { join } from 'path';

export function walkAndRender(
  dir: string,
  templateVariables: { [key: string]: string },
) {
  readdir(dir, { withFileTypes: true }, function(err, files) {
    if (err) throw err;

    files.forEach(function({ name, isDirectory, isFile }) {
      const filePath = join(dir, name);

      if (isDirectory()) {
        walkAndRender(filePath, templateVariables);
      } else if (isFile()) {
        writeFileSync(filePath, render(filePath, templateVariables));
      }
    });
  });
}
