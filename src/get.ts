import { get } from "https";
import { createWriteStream } from "fs";

export { fetch };

function fetch(url: string, dest: string) {
  return new Promise((resolve, reject) => {
    get(url, response => {
      const code = response.statusCode;
      if (!code || code >= 400) {
        reject({ code, message: response.statusMessage });
      } else if (code >= 300) {
        fetch(response.headers.location!, dest)
          .then(resolve)
          .catch(reject);
      } else {
        response
          .pipe(createWriteStream(dest))
          .on("finish", resolve)
          .on("error", reject);
      }
    }).on("error", reject);
  });
}
