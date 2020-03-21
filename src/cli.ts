import { join } from 'path';
import { downloadRepo } from './download-repo';
import { help } from './help';
import { debug } from './log';
import { prompt } from './prompt';
import { getValidConfig } from './validate';
import { walkAndRender } from './walk';

export async function cli(
  args: string[],
): Promise<{
  code: number;
  message: string;
}> {
  if (args[0] === '--help' || args[0] === '-h') {
    return {
      code: 0,
      message: help,
    };
  }

  try {
    const config = await getValidConfig(...args);
    const templateVariables = await downloadRepo(config);

    if (templateVariables.size > 0) {
      const variables: { [key: string]: string } = {};
      const questions = Array.from(templateVariables);

      for (let i = 0; i < questions.length; i += 1) {
        const question = questions[i];
        // eslint-disable-next-line no-await-in-loop
        const answer = await prompt(question);
        variables[question] = answer;
      }

      debug(`Variables: ${JSON.stringify(variables, null, 2)}`);

      const resolvedGlobs = config.ignoreGlobs.map((glob) =>
        join(config.resolvedDest, glob),
      );
      await walkAndRender(config.resolvedDest, variables, resolvedGlobs);
    }

    return {
      code: 0,
      message: `Successfully downloaded to ${config.resolvedDest}`,
    };
  } catch ({ code, message }) {
    return { code, message };
  }
}
