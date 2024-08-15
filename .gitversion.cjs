const { defineConfig } = require("gitbump");
const { S3Publish } = require('gitbump-s3publish');

module.exports = defineConfig({
  independentVersioning: false,
  featureBumpBehavior: 'always',  
  plugins: [
    new S3Publish({
      bucketName: 'www-cputils-com-website-docspublishbucket31a61f6d-pixklxvi0wye',
      baseFolder: 'docs',
      fileNameTemplate: [
        'gitbump/{version.major}.{version.minor}.x.zip',
        'gitbump/{releaseChannel}.zip',
      ],
      exclude: [
        ".vitepress",
      ],
    })
  ]
})
