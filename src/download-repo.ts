import { get } from 'https';
import { createGunzip } from 'zlib';
import { extract, Headers } from 'tar-fs';
import { ReadStream } from 'fs';
import { parse } from 'mustache';

function map(header: Headers) {
  // eslint-disable-next-line no-param-reassign
  header.name = header.name
    .split('/')
    .slice(1)
    .join('/');
  return header;
}

function getMapStream(templateVariables: Set<string>) {
  return (fileStream: ReadStream, { type }: Headers) => {
    if (type === 'file') {
      const templateChunks: string[] = [];

      fileStream.on('data', (chunk) => templateChunks.push(chunk.toString()));
      fileStream.on('end', () => {
        const template: string[] = parse(templateChunks.join(''));
        template
          .filter((entry) => entry[0] === 'name')
          .map((entry) => entry[1])
          .forEach((entry) => templateVariables.add(entry));
      });

      return fileStream;
    }

    return fileStream;
  };
}

export async function downloadRepo(
  archiveUrl: string,
  dest: string,
  templateVariables: Set<string>,
) {
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line consistent-return
    get(archiveUrl, (response) => {
      if (!response.statusCode || response.statusCode >= 400) {
        return reject(new Error(response.statusMessage));
      }

      if (response.statusCode >= 300) {
        const redirectUrl = response.headers.location;

        if (typeof redirectUrl === 'undefined') {
          return reject(
            new Error(
              `Received redirect code ${response.statusCode}, but headers are missing a "location" key`,
            ),
          );
        }

        downloadRepo(redirectUrl, dest, templateVariables).then(
          resolve,
          reject,
        );
      } else {
        const mapStream = getMapStream(templateVariables);
        response
          .pipe(createGunzip())
          .pipe(
            extract(dest, {
              map,
              mapStream,
            }),
          )
          .on('finish', resolve)
          .on('error', reject);
      }
    });
  });
}
