/** @type {import('@yarnpkg/types')} */
const { defineConfig } = require('@yarnpkg/types');

const { enforceGenericRules, enforceFieldsOnAllWorkspaces } = require('@cp-utils/constraints-config');

module.exports = defineConfig({

  async constraints({ Yarn }) {
    await enforceGenericRules(Yarn);

    enforceFieldsOnAllWorkspaces(Yarn, {
      ['engines.node']: '>=18.12.0',
    });
  },
});
