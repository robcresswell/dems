import { get } from 'https';
import { createGunzip } from 'zlib';
import { extract, Headers } from 'tar-fs';
import { ReadStream } from 'fs';
// import { parse } from 'mustache';

export { fetch };

function map(header: Headers) {
  header.name = header.name
    .split('/')
    .slice(1)
    .join('/');
  return header;
}

function mapStream(fileStream: ReadStream, { type }: Headers) {
  if (type === 'file') {
    return getTemplateData(fileStream);
  }

  return fileStream;
}

function getTemplateData(fileStream: ReadStream) {
  const templateChunks: string[] = [];

  fileStream.on('data', (chunk) => templateChunks.push(chunk.toString()));
  fileStream.on('finish', () => {
    // const template = parse(templateChunks.join(''));
  });

  return fileStream;
}

function fetch(url: string, dest: string) {
  return new Promise((_resolve, reject) => {
    get(url, (response) => {
      if (!response.statusCode || response.statusCode >= 400) {
        return reject(new Error(response.statusMessage));
      } else if (response.statusCode >= 300) {
        if (typeof response.headers.location === 'undefined') {
          return reject(
            new Error(
              `Received redirect code ${
                response.statusCode
              }, but headers are missing a "location" key`,
            ),
          );
        }

        fetch(response.headers.location, dest);
      } else {
        response.pipe(createGunzip()).pipe(extract(dest, { map, mapStream }));
      }
    });
  });
}
