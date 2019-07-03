import { walkAndRender } from './walk';
import { help } from './help';
import { getValidConfig } from './validate';
import { downloadRepo } from './download-repo';
import { askQuestions } from './ask-questions';

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
    const templateVariables = await downloadRepo(archiveUrl, resolvedDest);

    if (templateVariables.size > 0) {
      const variables = await askQuestions(templateVariables);
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
