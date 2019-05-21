import { render } from 'mustache';
import { readdir, writeFileSync, readFileSync } from 'fs';
import { join } from 'path';

export function walkAndRender(
  dir: string,
  templateVariables: { [key: string]: string },
) {
  readdir(dir, { withFileTypes: true }, function(err, files) {
    if (err) throw err;

    files.forEach(function(file) {
      const filePath = join(dir, file.name);

      if (file.isDirectory()) {
        walkAndRender(filePath, templateVariables);
      } else if (file.isFile()) {
        const file = readFileSync(filePath, { encoding: 'utf8' });
        writeFileSync(filePath, render(file, templateVariables));
      }
    });
  });
}
