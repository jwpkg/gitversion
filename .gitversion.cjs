const { defineConfig, FeatureBumpBehavior } = require("@cp-utils/gitversion");
const { S3Publish } = require('@cp-utils/gitversion-s3publish');

module.exports = defineConfig({
  independentVersioning: false,
  featureBumpBehavior: FeatureBumpBehavior.AllCommits,
  plugins: [
    new S3Publish({
      bucketName: 'www-cputils-com-website-docspublishbucket31a61f6d-pixklxvi0wye',
      baseFolder: 'docs',
      fileNameTemplate: 'gitversion/{version.major}.{version.minor}.x.zip',
      files: [
        '**/*.md'
      ],
    })
  ]
})
