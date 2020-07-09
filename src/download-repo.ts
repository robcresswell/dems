import { ReadStream } from 'fs';
import { get } from 'https';
import * as minimatch from 'minimatch';
import { parse } from 'mustache';
import { extract, Headers } from 'tar-fs';
import { createGunzip } from 'zlib';
import { Config } from './types';

function map(header: Headers) {
  // eslint-disable-next-line no-param-reassign
  header.name = header.name.split('/').slice(1).join('/');
  return header;
}

function getMapStream(templateVariables: Set<string>, globsToIgnore: string[]) {
  return (fileStream: ReadStream, { type, name }: Headers) => {
    if (
      type !== 'file' ||
      globsToIgnore.some((glob) => minimatch(name, glob))
    ) {
      return fileStream;
    }

    const templateChunks: string[] = [];

    fileStream.on('data', (chunk) => templateChunks.push(chunk.toString()));
    fileStream.on('end', () => {
      const template = parse(templateChunks.join(''));
      template
        .filter((entry) => entry[0] === 'name')
        .map((entry) => entry[1])
        .forEach((entry) => templateVariables.add(entry));
    });

    return fileStream;
  };
}

export async function downloadRepo({
  archiveUrl,
  resolvedDest,
  ignoreGlobs,
}: Config): Promise<Set<string>> {
  return new Promise((resolve, reject) => {
    // TODO: Clean up this side-effect nightmare
    const templateVariables: Set<string> = new Set();

    // eslint-disable-next-line consistent-return
    get(archiveUrl, async (response) => {
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

        downloadRepo({
          archiveUrl: redirectUrl,
          resolvedDest,
          ignoreGlobs,
        }).then(resolve, reject);
      } else {
        const mapStream = getMapStream(templateVariables, ignoreGlobs);

        response
          .pipe(createGunzip())
          .pipe(
            extract(resolvedDest, {
              map,
              mapStream,
            }),
          )
          .on('finish', () => resolve(templateVariables))
          .on('error', reject);
      }
    });
  });
}
