const { defineConfig, FeatureBumpBehavior, MSTeamsPlugin } = require("@cp-utils/gitversion");
const { GitPlatformDefault } = require("@cp-utils/gitversion/src/plugins/embedded/default");

module.exports = defineConfig({
  independentVersioning: false,
  featureBumpBehavior: FeatureBumpBehavior.AllCommits,
  plugins: [
  ]
})