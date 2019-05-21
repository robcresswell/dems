#! /usr/bin/env node

import { cli } from './cli';
import { logError, logInfo } from './log';

(async () => {
  const { code, message } = await cli(process.argv.slice(2));

  if (code === 0) {
    logInfo(message);
  } else {
    logError(message);
  }

  process.exit(code);
})();
