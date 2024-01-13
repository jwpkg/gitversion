/* eslint-disable @typescript-eslint/naming-convention */
/** @type {import('eslint').Linter.BaseConfig} */
module.exports = {
  extends: [
    '@cp-utils/eslint-config',
    // '@cp-utils/eslint-config/local-react',
    // '@cp-utils/eslint-config/local-markdown',
  ],
  overrides: [{
    files: ['workspaces/utils/eslint-config/**'],
    rules: {
      '@typescript-eslint/naming-convention': 0,
    },
  }],
  rules: {

  },
};
