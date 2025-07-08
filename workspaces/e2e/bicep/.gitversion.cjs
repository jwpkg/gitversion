const { defineConfig } = require('@jwpkg/gitversion');
const { BicepProject } = require('@jwpkg/gitversion-plugin-bicep');

module.exports = defineConfig({
  independentVersioning: false,
  plugins: [
    new BicepProject({
      manifestName: 'metadata.json',
      workspaceGlob: 'workspaces/*',
    }),
    // new S3Publish({
    //   bucketName: 'www-cputils-com-website-docspublishbucket31a61f6d-pixklxvi0wye',
    //   baseFolder: 'docs',
    //   fileNameTemplate: [
    //     'gitversion/{version.major}.{version.minor}.x.zip',
    //     'gitversion/{releaseChannel}.zip',
    //   ],
    //   exclude: [
    //     ".vitepress",
    //   ],
    // })
  ],
});
