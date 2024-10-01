/* eslint-disable @typescript-eslint/naming-convention */
const globalConfig = require('@jwpkg/eslint-config');

module.exports = [
  {
    files: [
      '**/*.ts',
    ],
    ignores: [
      '**/lib/**',
      '*.json',
    ],
  },
  ...globalConfig,
  {
    ignores: [
      '**/lib/**',
      '*.json',
    ],
  },
  {
    files: ['**/package.json'],
    rules: {
      'eol-last': [2, 'always'],
    },
  },
];
