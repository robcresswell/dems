import { promisify } from 'util';
import { exec } from 'child_process';

export const pExec = promisify(exec);
