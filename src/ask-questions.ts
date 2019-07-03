import { prompt } from './prompt';
import { Question } from './types';
import { debug } from './log';

export async function askQuestions(templateVariables: Set<string>) {
  const variables: { [key: string]: string } = {};
  const questions = Array.from(templateVariables);

  for (let i = 0; i < questions.length; i += 1) {
    const question = questions[i];
    // eslint-disable-next-line no-await-in-loop
    const answer = await prompt(question);
    variables[question] = answer;
  }

  debug(`Variables: ${JSON.stringify(variables, null, 2)}`);
  return variables;
}
