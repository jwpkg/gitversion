const { defineConfig, FeatureBumpBehavior, MSTeamsPlugin } = require("@cp-utils/gitversion");
const { GitPlatformDefault } = require("@cp-utils/gitversion/src/plugins/embedded/default");

module.exports = defineConfig({
  independentVersioning: false,
  featureBumpBehavior: FeatureBumpBehavior.AllCommits,
  plugins: [
    new MSTeamsPlugin('https://aegon.webhook.office.com/webhookb2/5c254fad-97dd-4809-8157-33f7f9ec567b@46e16835-c804-41de-be3c-55835d14dee4/IncomingWebhook/e90853ccc9674fa4abc0a39c36e9e978/8e69b8e2-2e51-46f8-9113-349a9c0c553d')
  ]
})