import { walkAndRender } from './walk';
import { help } from './help';
import { getValidConfig } from './validate';
import { downloadRepo } from './download-repo';
import { prompt } from './prompt';
import { debug } from './log';

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
    const { resolvedDest, archiveUrl } = await getValidConfig(...args);

    // TODO: Clean up this side-effect nightmare
    const templateVariables: Set<string> = new Set();
    await downloadRepo(archiveUrl, resolvedDest, templateVariables);

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

      await walkAndRender(resolvedDest, variables);
    }

    return {
      code: 0,
      message: `Successfully downloaded to ${resolvedDest}`,
    };
  } catch ({ code, message }) {
    return { code, message };
  }
}
