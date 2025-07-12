const { createDefaultPreset } = require('ts-jest');

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
module.exports = {
  testEnvironment: 'node',
  testTimeout: 30000,
  transform: {
    ...tsJestTransformCfg,
  },
};
