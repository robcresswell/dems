import { debuglog } from 'util';

const reset = '\x1b[0m';
const red = '\x1b[31m';
const cyan = '\x1b[36m';
export const debug = debuglog('dems');

export function logError(message: string) {
  // eslint-disable-next-line no-console
  console.error(`${red}${message}${reset}`);
}

export function logInfo(message: string) {
  // eslint-disable-next-line no-console
  console.error(`${cyan}${message}${reset}`);
}
