const { defineConfig, FeatureBumpBehavior } = require("@cp-utils/gitversion");
const { GitPlatformDefault } = require("@cp-utils/gitversion/src/plugins/embedded/default");

module.exports = defineConfig({
  independentVersioning: false,
  featureBumpBehavior: FeatureBumpBehavior.AllCommits,
  // platform: new GitPlatformDefault()
})