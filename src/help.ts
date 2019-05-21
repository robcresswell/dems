export const help = `
dems is a scaffolding tool that uses Git and Mustache templating.

Usage:

  $ npx dems user/repo

You may also pass in an alternate destination to clone to:

  $ npx dems user/repo target

dems returns a 0 exit code on success, or >= 1 on error. The error codes have
specific meanings, which can be useful when scripting with dems.
`;
