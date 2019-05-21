import { debuglog } from 'util';
import { reset, red, cyan } from './colors';
const debug = debuglog('dems');

export { logDebug, logInfo, logError };

function logError(message: string) {
  console.info(`\n${red}${message}${reset}\n`);
}

function logInfo(message: string) {
  console.info(`\n${cyan}${message}${reset}\n`);
}

function logDebug(message: string) {
  debug(message);
}
