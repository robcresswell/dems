import { debuglog } from "util";
const log = debuglog("dems");

const reset = "\x1b[0m";
const red = "\x1b[31m";
// const green = "\x1b[32m";
// const yellow = "\x1b[33m";
// const blue = "\x1b[34m";
// const magenta = "\x1b[35m";
const cyan = "\x1b[36m";
// const white = "\x1b[37m";

export { logDebug, logInfo, logError };

function logError(message: string) {
  console.info(`\n${red}${message}${reset}\n`);
}

function logInfo(message: string) {
  console.info(`\n${cyan}${message}${reset}\n`);
}

function logDebug(message: string) {
  log(message);
}
