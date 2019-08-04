import { createInterface } from 'readline';

/**
 * Prompts for user input, displaying the given `question` string, and returns
 * the users input a a string
 */
export async function prompt(question: string): Promise<string> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`${question}: `, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}
