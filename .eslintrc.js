/* eslint-disable @typescript-eslint/naming-convention */
/** @type {import('eslint').Linter.BaseConfig} */
module.exports = {
  extends: [
    '@cp-utils/eslint-config',
  ],
  overrides: [{
    files: ['workspaces/utils/eslint-config/**'],
    rules: {
      '@typescript-eslint/naming-convention': 0,
    },
  }, {
    files: ['**/package.json'],
    rules: {
      'eol-last': [2, 'always'],
    },
  }],
};
