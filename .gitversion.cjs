const { defineConfig, FeatureBumpBehavior } = require("@cp-utils/gitversion");

module.exports = defineConfig({
  independentVersioning: false,
  featureBumpBehavior: FeatureBumpBehavior.AllCommits
})