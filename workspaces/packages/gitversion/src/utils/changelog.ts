import { ConventionalCommit } from './conventional-commmit-utils';
import * as md from './markdown';
import { GitSemverTag } from './version-utils';

export interface ChangeLogUrls {
  compareUrl: (a: string, b: string) => string;
  commitUrl: (hash: string) => string;
}

export function generateChangeLogEntry(commits: ConventionalCommit[], version: GitSemverTag, previousVersion: GitSemverTag, urls: ChangeLogUrls): string {
  return [
    md.h2(
      md.link(
        version.version.format(),
        urls.compareUrl(previousVersion.version.format(), version.version.format()),
      ),
      `(${new Date().toDateString})`,
    ),
    '',
    '',
    Object.entries(groupByType(commits)).map(([type, commits]) => [
      md.h3(type),
      '',
      commits.map(commit => [
        renderCommit(commit, urls),
      ].join('\n')),
    ].join('\n')),

  ].join('\n');
}

export function renderCommit(commit: ConventionalCommit, urls: ChangeLogUrls) {
  if (commit.scope) {
    return md.li(md.b(commit.scope), commit.message, `(${md.link(commit.shortHash, urls.commitUrl(commit.hash))})`);
  } else {
    return md.li(commit.message, `(${md.link(commit.shortHash, urls.commitUrl(commit.hash))})`);
  }
}

export function groupByType(commits: ConventionalCommit[]): Record<string, ConventionalCommit[]> {
  const result: Record<string, ConventionalCommit[]> = {};
  commits.forEach(commit => {
    if (!result[commit.type]) {
      result[commit.type] = [commit];
    } else {
      result[commit.type].push(commit);
    }
  });
  return result;
}


`# Changelog

All notable changes to this project will be documented in this file

## [5.19.5](https://dev.azure.com/aegon-nl/anl-cdk/branchCompare?baseVersion=GTv5.19.4&targetVersion=GTv5.19.5&_a=files) (2023-11-21)


### Bug Fixes

* Reverted missing slash in output url ([8e8687a](https://dev.azure.com/aegon-nl/anl-cdk/commit/8e8687a18fa4a86b128fec1a750e95c94e233c21))

## [5.19.4](https://dev.azure.com/aegon-nl/anl-cdk/branchCompare?baseVersion=GTv5.19.3&targetVersion=GTv5.19.4&_a=files) (2023-11-20)


### Bug Fixes

* Merge deploy options if provided ([c41c234](https://dev.azure.com/aegon-nl/anl-cdk/commit/c41c2340735153a20395e17591efa6660daeaa3f))

## [5.19.1](https://dev.azure.com/aegon-nl/anl-cdk/branchCompare?baseVersion=GTv5.19.0&targetVersion=GTv5.19.1&_a=files) (2023-11-14)


### Bug Fixes

* Fix incorrect scope usage in AnlCdkUnauthenticatedRestApi ([7f6b7f8](https://dev.azure.com/aegon-nl/anl-cdk/commit/7f6b7f8d9fc219066a3bd279e0b45c3c945c1ed7))

## [5.19.0](https://dev.azure.com/aegon-nl/anl-cdk/branchCompare?baseVersion=GTv5.18.2&targetVersion=GTv5.19.0&_a=files) (2023-11-13)


### Features

* Add sites organization ([ed23dde](https://dev.azure.com/aegon-nl/anl-cdk/commit/ed23dde03c69cb248c0fb6b104619e47c41ac287))

## [5.18.2](https://dev.azure.com/aegon-nl/anl-cdk/branchCompare?baseVersion=GTv5.18.1&targetVersion=GTv5.18.2&_a=files) (2023-10-30)


### Bug Fixes

* added dateTime to the evidence ([7abadf1](https://dev.azure.com/aegon-nl/anl-cdk/commit/7abadf1aa3a116fcd7b6fc637a03cb7aa9841b47))

## [5.18.1](https://dev.azure.com/aegon-nl/anl-cdk/branchCompare?baseVersion=GTv5.18.0&targetVersion=GTv5.18.1&_a=files) (2023-10-17)


### Bug Fixes

* Removed star resource for assume ([c4a96be](https://dev.azure.com/aegon-nl/anl-cdk/commit/c4a96be1d67d8799a2be8b3c545a49c590bea77d))

## [5.18.0](https://dev.azure.com/aegon-nl/anl-cdk/branchCompare?baseVersion=GTv5.17.1&targetVersion=GTv5.18.0&_a=files) (2023-10-11)


### Features

* Add www subdomain to unauthenticated API ([bf39930](https://dev.azure.com/aegon-nl/anl-cdk/commit/bf3993057f4f1d376ef825e8091bbde0de91c019))

## [5.17.1](https://dev.azure.com/aegon-nl/anl-cdk/branchCompare?baseVersion=GTv5.17.0&targetVersion=GTv5.17.1&_a=files) (2023-10-04)


### Bug Fixes

* Updated dependencies ([07398cd](https://dev.azure.com/aegon-nl/anl-cdk/commit/07398cd71a5d264254766a059283fe7b3d98c8bd))

## [5.17.0](https://dev.azure.com/aegon-nl/anl-cdk/branchCompare?baseVersion=GTv5.16.1&targetVersion=GTv5.17.0&_a=files) (2023-10-02)


### Features

* AnlCdkUnauthenticatedRestApiProps ([4f88dfa](https://dev.azure.com/aegon-nl/anl-cdk/commit/4f88dfab52f19289e6f7f423f05f1fb59ceed24c))
* Dynamo integration patterns ([87de2d4](https://dev.azure.com/aegon-nl/anl-cdk/commit/87de2d4ae9864f30d038875271fbb15fd1194ecb))

## [5.16.1](https://dev.azure.com/aegon-nl/anl-cdk/branchCompare?baseVersion=GTv5.16.0&targetVersion=GTv5.16.1&_a=files) (2023-09-13)


### Bug Fixes

* Conditions env readout ([9e6d257](https://dev.azure.com/aegon-nl/anl-cdk/commit/9e6d257ba2ee1b7aef68e24306b12e4ba09c86bb))

## [5.16.0](https://dev.azure.com/aegon-nl/anl-cdk/branchCompare?baseVersion=GTv5.15.0&targetVersion=GTv5.16.0&_a=files) (2023-09-13)


### Features

* **core:** Add S3BucketServerAccessLoggingAspect to @anl-cdk/core ([9cb7e8d](https://dev.azure.com/aegon-nl/anl-cdk/commit/9cb7e8d78e6d4a663eaa33946535e159fc71a8e5))

## [5.15.0](https://dev.azure.com/aegon-nl/anl-cdk/branchCompare?baseVersion=GTv5.14.2&targetVersion=GTv5.15.0&_a=files) (2023-09-13)


### Features

* AnlTrusted accounts role (alpha) ([7b0cbf9](https://dev.azure.com/aegon-nl/anl-cdk/commit/7b0cbf91333024b8b6f1d49898a875188aac6ece))

## [5.14.0](https://dev.azure.com/aegon-nl/anl-cdk/branchCompare?baseVersion=GTv5.13.4&targetVersion=GTv5.14.0&_a=files) (2023-09-04)


### Features

* Customizable file processing pattern ([4bbffe5](https://dev.azure.com/aegon-nl/anl-cdk/commit/4bbffe56c62968dec976f78e4a5a68ce89ada607))

## [5.13.4](https://dev.azure.com/aegon-nl/anl-cdk/branchCompare?baseVersion=GTv5.13.3&targetVersion=GTv5.13.4&_a=files) (2023-09-01)


### Bug Fixes

* increased file transfer lambda timeout ([d255bb7](https://dev.azure.com/aegon-nl/anl-cdk/commit/d255bb72a72f704a7c076410632398755caadb50))

## [5.13.2](https://dev.azure.com/aegon-nl/anl-cdk/branchCompare?baseVersion=GTv5.13.1&targetVersion=GTv5.13.2&_a=files) (2023-08-24)


### Bug Fixes

* **project:** Use node 18 pinned docker image ([49d3bbe](https://dev.azure.com/aegon-nl/anl-cdk/commit/49d3bbe8fc4a65d6bab0a3c49e89e0f8833a11d8))

## [5.13.1](https://dev.azure.com/aegon-nl/anl-cdk/branchCompare?baseVersion=GTv5.13.0&targetVersion=GTv5.13.1&_a=files) (2023-08-16)


### Bug Fixes

* **project:** Test per package changelog file ([64f431c](https://dev.azure.com/aegon-nl/anl-cdk/commit/64f431ce523a40c33e285054711c8e5d8cf7832f))

## [5.13.0](https://dev.azure.com/aegon-nl/anl-cdk/branchCompare?baseVersion=GTv5.12.0&targetVersion=GTv5.13.0&_a=files) (2023-08-16)


### Features

* **docs:** ANL CDK Roadmap ([6153085](https://dev.azure.com/aegon-nl/anl-cdk/commit/615308500128e39626f3190668285b5fac07fc47))


### Bug Fixes

* Update gitversion for Changelog support ([eb95580](https://dev.azure.com/aegon-nl/anl-cdk/commit/eb95580c73b8e44c93724c885e1f58039b8e8365))

## [4.5.1](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/branchCompare?baseVersion=GTv4.5.0&targetVersion=GTv4.5.1&_a=commits) (2022-08-16)

### Bug Fixes

- Upgrade @anl-projen/core to support renovateBot: false option ([4e4fee5](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commit/4e4fee5cf2412df1eaf07c9227af22452b5ddfa9))

# [4.5.0](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/branchCompare?baseVersion=GTv4.4.2&targetVersion=GTv4.5.0&_a=commits) (2022-07-14)

### Features

- implement whitelist sources in anl cdk ([619f897](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commit/619f8970bc3205d753f427f4551f2a5f4ef511eb))

## [4.4.1](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/branchCompare?baseVersion=GTv4.4.0&targetVersion=GTv4.4.1&_a=commits) (2022-06-22)

### Bug Fixes

- Align @anl-cdk/projen version with anlCdkVersion and upgrade pipeline to node 14 ([004e3d5](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commit/004e3d539b96248d437b9e1a12fd71d7355ff319))

# [4.4.0](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/branchCompare?baseVersion=GTv4.3.0&targetVersion=GTv4.4.0&_a=commits) (2022-06-16)

### Features

- **api:** Silently ignore already created KVM's in the creation process ([069a43a](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commit/069a43a33be05bd71ec77551c58dfb97be771246))

## [4.2.3](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/branchCompare?baseVersion=GTv4.2.2&targetVersion=GTv4.2.3&_a=commits) (2022-06-09)

### Bug Fixes

- Regex for content type validation is broken ([cd89032](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commit/cd89032195140f8f9f2ab070531f270e0de6b0a7))

## [4.2.2](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/branchCompare?baseVersion=GTv4.2.1&targetVersion=GTv4.2.2&_a=commits) (2022-05-31)

### Bug Fixes

- Use cdk version in diff and deploy pipeline stages ([1d4537a](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commit/1d4537a23bfc4ea24357ab87fefb8dca13e3aac7))

## [4.2.1](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/branchCompare?baseVersion=GTv4.2.0&targetVersion=GTv4.2.1&_a=commits) (2022-05-13)

### Bug Fixes

- added extra information on failure of apigee custom resource ([86c997e](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commit/86c997e952715446002a5f71b92b5cafeb75d0e4))

# [4.2.0](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/branchCompare?baseVersion=GTv4.1.1&targetVersion=GTv4.2.0&_a=commits) (2022-05-10)

### Features

- Add support for developer-nonprod and developer-prod organization ([188bd5f](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commit/188bd5f2ce6f19e19b91d3739947e534a5b8c07e))

## [4.1.1](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/branchCompare?baseVersion=GTv4.1.0&targetVersion=GTv4.1.1&_a=commits) (2022-05-09)

### Bug Fixes

- Use internal Deployment construct of ApiGateway ([e548d24](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commit/e548d24b20afd7dca034c1d4ba9f96a8dbd5a59f))

# [4.1.0](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/branchCompare?baseVersion=GTv4.0.4&targetVersion=GTv4.1.0&_a=commits) (2022-04-25)

### Features

- Add useAccelerateEndpoint to AnlCdkFileTransferProps ([f53f519](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commit/f53f519ae864596826cad7d2c1e5f6b2fb8c80ed))

## [4.0.4](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/branchCompare?baseVersion=GTv4.0.3&targetVersion=GTv4.0.4&_a=commits) (2022-04-22)

### Bug Fixes

- removed certificate creation ([ddd3121](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commit/ddd3121d3f7d39a08a3df1811d77496b4860d224))

## [4.0.3](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/branchCompare?baseVersion=GTv4.0.2&targetVersion=GTv4.0.3&_a=commits) (2022-04-21)

### Bug Fixes

- Update Apigee lambdas to NODE_14_X ([2be3ebb](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commit/2be3ebba6444d24542bfd78a40af935da649a7a2))

## [4.0.2](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/branchCompare?baseVersion=GTv4.0.1&targetVersion=GTv4.0.2&_a=commits) (2022-04-14)

### Bug Fixes

- **api:** Fixed incorrect context lookup in parameter validation ([31638cc](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commit/31638ccbac270c30ca7fca18e2ecd3835bd3ca25))

## [4.0.1](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/branchCompare?baseVersion=GTv4.0.1-tf-1930-v4.0&targetVersion=GTv4.0.1&_a=commits) (2022-04-14)

### Bug Fixes

- Fix auto-publish pipeline ([fc12d89](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commit/fc12d89f0e4b00e22167f5de63fe9231d871cf95))

# [4.0.0](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/branchCompare?baseVersion=GTv3.1.26-tf-1912.1&targetVersion=GTv4.0.0&_a=commits) (2022-04-12)

# [4.0.0-tf-1908-release.4](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/branchCompare?baseVersion=GTv3.1.25-tf-1929.0&targetVersion=GTv4.0.0-tf-1908-release.4&_a=commits) (2022-04-11)

## [3.1.25-tf-1929.0](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/branchCompare?baseVersion=GTv4.0.0-tf-1908-release.3&targetVersion=GTv3.1.25-tf-1929.0&_a=commits) (2022-04-11)

### Bug Fixes

- Error handling in newly created ANL CDK stacks ([bad7b72](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commit/bad7b729b989bbb58a513366791c67ff55540c26))

# [4.0.0-tf-1908-release.3](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/branchCompare?baseVersion=GTv3.1.24&targetVersion=GTv4.0.0-tf-1908-release.3&_a=commits) (2022-04-11)

# [4.0.0-tf-1908-release.2](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/branchCompare?baseVersion=GTv4.0.0-tf-1908-release.1&targetVersion=GTv4.0.0-tf-1908-release.2&_a=commits) (2022-04-11)

# [4.0.0-tf-1908-release.0](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/branchCompare?baseVersion=GTv3.1.23&targetVersion=GTv4.0.0-tf-1908-release.0&_a=commits) (2022-04-08)

### Features

- Refactor the File Transfer CDK Construct interface ([30dfdf8](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commit/30dfdf8ef7022b8fbf45c60f5223f34f095572e5))

### BREAKING CHANGES

- Refactor the File Transfer CDK Construct interface

# [4.0.0-tf-1908-release.5](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/branchCompare?baseVersion=GTv3.1.25&targetVersion=GTv4.0.0-tf-1908-release.5&_a=commits) (2022-04-12)

# [4.0.0-tf-1908-release.4](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/branchCompare?baseVersion=GTv3.1.25-tf-1929.0&targetVersion=GTv4.0.0-tf-1908-release.4&_a=commits) (2022-04-11)

# [4.0.0-tf-1908-release.3](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/branchCompare?baseVersion=GTv3.1.24&targetVersion=GTv4.0.0-tf-1908-release.3&_a=commits) (2022-04-11)

# [4.0.0-tf-1908-release.2](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/branchCompare?baseVersion=GTv4.0.0-tf-1908-release.1&targetVersion=GTv4.0.0-tf-1908-release.2&_a=commits) (2022-04-11)

# [4.0.0-tf-1908-release.0](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/branchCompare?baseVersion=GTv3.1.23&targetVersion=GTv4.0.0-tf-1908-release.0&_a=commits) (2022-04-08)

### Features

- Refactor the File Transfer CDK Construct interface ([30dfdf8](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commit/30dfdf8ef7022b8fbf45c60f5223f34f095572e5))

### BREAKING CHANGES

- Refactor the File Transfer CDK Construct interface

## [3.1.25-tf-1929.0](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/branchCompare?baseVersion=GTv3.1.24&targetVersion=GTv3.1.25-tf-1929.0&_a=commits) (2022-04-11)

### Bug Fixes

- Error handling in newly created ANL CDK stacks ([bad7b72](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commit/bad7b729b989bbb58a513366791c67ff55540c26))

## [3.1.21-tf-1893.0](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/branchCompare?baseVersion=GTv3.1.20&targetVersion=GTv3.1.21-tf-1893.0&_a=commits) (2022-03-30)

### Bug Fixes

- Execute yarn-audit-fix ([6d3cbdf](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commit/6d3cbdff1b915d9666ef007ba7fc2ef5c6c89eaf))
- Upgrade node-forge to ^1.3.1 ([968da2f](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commit/968da2f5a4f915ecdddfb235f6a07faf8a1cdb19))

## [3.1.20-tf-946b.0](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/branchCompare?baseVersion=GTv3.1.19&targetVersion=GTv3.1.20-tf-946b.0&_a=commits) (2022-03-15)

### Bug Fixes

- added delegation role arn for nl.aegon.io ([dc7254f](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commit/dc7254f803a36aa137724e32ae3242b7b2b56015))

## [3.1.19-tf-1878.0](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/branchCompare?baseVersion=GTv3.1.18&targetVersion=GTv3.1.19-tf-1878.0&_a=commits) (2022-03-14)

### Bug Fixes

- improved schema parsing and file-transfer default schema ([2d52f83](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commit/2d52f8338ff62e6998f47b8e0fc05f51dc65568b))

## [3.1.18-tf-1697a.0](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/branchCompare?baseVersion=GTv3.1.17&targetVersion=GTv3.1.18-tf-1697a.0&_a=commits) (2022-03-11)

### Bug Fixes

- exported hostedzone ([f473b53](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commit/f473b531716f85fcb478ff2957787c9194237eee))

# [3.2.0-tf-1418.14](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/branchCompare?baseVersion=GTv3.2.0-tf-1418.13&targetVersion=GTv3.2.0-tf-1418.14&_a=commits) (2022-03-07)

## [3.1.12-tf-1848.13](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/branchCompare?baseVersion=GTv3.1.12-tf-1848.12&targetVersion=GTv3.1.12-tf-1848.13&_a=commits) (2022-03-03)

## [3.1.12-tf-1848.12](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/branchCompare?baseVersion=GTv3.1.12-tf-1848.11&targetVersion=GTv3.1.12-tf-1848.12&_a=commits) (2022-03-03)

## [3.1.12-tf-1848.11](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/branchCompare?baseVersion=GTv3.1.12-tf-1848.9&targetVersion=GTv3.1.12-tf-1848.11&_a=commits) (2022-03-03)

## [3.1.12-tf-1848.9](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/branchCompare?baseVersion=GTv3.1.12-tf-1848.8&targetVersion=GTv3.1.12-tf-1848.9&_a=commits) (2022-03-03)

## [3.1.12-tf-1848.7](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/branchCompare?baseVersion=GTv3.1.12-tf-1848.6&targetVersion=GTv3.1.12-tf-1848.7&_a=commits) (2022-03-02)

## [3.1.12-tf-1848.6](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/branchCompare?baseVersion=GTv3.1.12-tf-1848.5&targetVersion=GTv3.1.12-tf-1848.6&_a=commits) (2022-03-02)

## [3.1.12-tf-1848.5](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/branchCompare?baseVersion=GTv3.1.12-tf-1848.3&targetVersion=GTv3.1.12-tf-1848.5&_a=commits) (2022-03-01)

## [3.1.12-tf-1848.3](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/branchCompare?baseVersion=GTv3.1.12-tf-1848.2&targetVersion=GTv3.1.12-tf-1848.3&_a=commits) (2022-03-01)

## [3.1.12-tf-1848.2](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/branchCompare?baseVersion=GTv3.1.12-tf-1848.0&targetVersion=GTv3.1.12-tf-1848.2&_a=commits) (2022-03-01)

## [3.1.12-tf-1848.0](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/branchCompare?baseVersion=GTv3.1.12-tf-1848.4&targetVersion=GTv3.1.12-tf-1848.0&_a=commits) (2022-03-01)

## [3.1.12-tf-1848.4](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/branchCompare?baseVersion=GTv3.1.12-tf-1848.1&targetVersion=GTv3.1.12-tf-1848.4&_a=commits) (2022-03-01)

## [3.1.11-tf-1847.1](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/branchCompare?baseVersion=GTv3.2.0-tf-1418.10&targetVersion=GTv3.1.11-tf-1847.1&_a=commits) (2022-02-24)

## [3.1.11-tf-1847.0](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/branchCompare?baseVersion=GTv3.2.0-tf-1418.9&targetVersion=GTv3.1.11-tf-1847.0&_a=commits) (2022-02-24)

### Bug Fixes

- fix unit test failure in clam av stack where waf attribute is not loaded ([aa921e9](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commit/aa921e96b29b32fd0b185bafbac2245783990a00))

# [3.2.0](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/compare/v3.2.0-tf-1727a.3...v3.2.0-tf-1677-br.0) (2021-12-09)

### Features

- File transfer package ([2e5dd0d](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commits/2e5dd0d7073a841765485f78a13e1f68d81ecfbf))

## [3.1.1-tf-1677.4](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/compare/v3.1.1-tf-1677.3...v3.1.1-tf-1677.4) (2021-12-02)

### Bug Fixes

- added lambda lib ([47cac62](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commits/47cac6248974f3043a1dae81b4c3b5852d27ba59))

## [3.0.1-tf-1491.7](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/compare/v3.0.1-tf-1491.6...v3.0.1-tf-1491.7) (2021-11-30)

### Reverts

- Revert "projen upgrade" ([b043a35](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commits/b043a3568474d5e3249b928c27ba88d36972cc29))
- Revert "feat: added standard version bumping" ([f217e37](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commits/f217e37108c3d235a186ec567da934bf439c0065))

# [3.2.0-tf-1727a.2](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/compare/v3.0.1-tf-1491.6...v3.2.0-tf-1727a.2) (2021-12-08)

### Bug Fixes

- Context variable from azure library groups ([222336c](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commits/222336c51f4f9fdcc2dcec7c8dfeb5f45176cd2b))

### Features

- added standard version bumping ([7e0670a](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commits/7e0670a88f4cb6d3508afaad91b95e9b219c5572))

### Reverts

- Revert "Publish" ([94ee025](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commits/94ee025ddd14963a3292a73729dd6d16bdc6712c))

# [3.2.0-tf-1727a.1](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/compare/v3.0.1-tf-1491.6...v3.2.0-tf-1727a.1) (2021-12-08)

### Bug Fixes

- Context variable from azure library groups ([222336c](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commits/222336c51f4f9fdcc2dcec7c8dfeb5f45176cd2b))

### Features

- added standard version bumping ([7e0670a](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commits/7e0670a88f4cb6d3508afaad91b95e9b219c5572))

### Reverts

- Revert "Publish" ([94ee025](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commits/94ee025ddd14963a3292a73729dd6d16bdc6712c))

# [3.2.0-tf-1727a.0](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/compare/v3.0.1-tf-1491.6...v3.2.0-tf-1727a.0) (2021-12-08)

### Bug Fixes

- Context variable from azure library groups ([222336c](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commits/222336c51f4f9fdcc2dcec7c8dfeb5f45176cd2b))

### Features

- added standard version bumping ([7e0670a](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commits/7e0670a88f4cb6d3508afaad91b95e9b219c5572))

### Reverts

- Revert "Publish" ([94ee025](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commits/94ee025ddd14963a3292a73729dd6d16bdc6712c))

# [3.2.0-tf-1727a.1](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/compare/v3.0.1-tf-1491.6...v3.2.0-tf-1727a.1) (2021-12-08)

### Bug Fixes

- Context variable from azure library groups ([222336c](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commits/222336c51f4f9fdcc2dcec7c8dfeb5f45176cd2b))

### Features

- added standard version bumping ([7e0670a](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commits/7e0670a88f4cb6d3508afaad91b95e9b219c5572))

### Reverts

- Revert "Publish" ([94ee025](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commits/94ee025ddd14963a3292a73729dd6d16bdc6712c))

# [3.2.0-tf-1727a.0](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/compare/v3.0.1-tf-1491.6...v3.2.0-tf-1727a.0) (2021-12-08)

### Bug Fixes

- Context variable from azure library groups ([222336c](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commits/222336c51f4f9fdcc2dcec7c8dfeb5f45176cd2b))

### Features

- added standard version bumping ([7e0670a](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commits/7e0670a88f4cb6d3508afaad91b95e9b219c5572))

### Reverts

- Revert "Publish" ([94ee025](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commits/94ee025ddd14963a3292a73729dd6d16bdc6712c))

# [3.2.0-tf-1727a.0](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/compare/v3.0.1-tf-1491.6...v3.2.0-tf-1727a.0) (2021-12-08)

### Bug Fixes

- Context variable from azure library groups ([222336c](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commits/222336c51f4f9fdcc2dcec7c8dfeb5f45176cd2b))

### Features

- added standard version bumping ([7e0670a](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commits/7e0670a88f4cb6d3508afaad91b95e9b219c5572))

### Reverts

- Revert "Publish" ([94ee025](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commits/94ee025ddd14963a3292a73729dd6d16bdc6712c))

# [3.2.0-tf-1727a.0](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/compare/v3.0.1-tf-1491.6...v3.2.0-tf-1727a.0) (2021-12-08)

### Bug Fixes

- Context variable from azure library groups ([222336c](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commits/222336c51f4f9fdcc2dcec7c8dfeb5f45176cd2b))

### Features

- added standard version bumping ([7e0670a](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commits/7e0670a88f4cb6d3508afaad91b95e9b219c5572))

### Reverts

- Revert "Publish" ([94ee025](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commits/94ee025ddd14963a3292a73729dd6d16bdc6712c))

# [3.2.0-tf-1727a.0](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/compare/v3.0.1-tf-1491.6...v3.2.0-tf-1727a.0) (2021-12-08)

### Bug Fixes

- Context variable from azure library groups ([222336c](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commits/222336c51f4f9fdcc2dcec7c8dfeb5f45176cd2b))

### Features

- added standard version bumping ([7e0670a](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commits/7e0670a88f4cb6d3508afaad91b95e9b219c5572))

### Reverts

- Revert "Publish" ([94ee025](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commits/94ee025ddd14963a3292a73729dd6d16bdc6712c))

# [3.2.0-tf-1727a.0](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/compare/v3.0.1-tf-1491.6...v3.2.0-tf-1727a.0) (2021-12-02)

### Features

- added standard version bumping ([7e0670a](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commits/7e0670a88f4cb6d3508afaad91b95e9b219c5572))

### Reverts

- Revert "Publish" ([94ee025](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commits/94ee025ddd14963a3292a73729dd6d16bdc6712c))

# 3.2.0-tf-1727a.0 (2021-12-02)

### Bug Fixes

- add additional mocks ([680a906](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commits/680a90627c2ae581f71a82f450a9329d4355b7ea))
- add anl cdk core and anl cdk assert as default dependencies ([2f6eaeb](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commits/2f6eaebdea563a8206e0d8d4ea184663ef802264))
- add anl cdk core and anl cdk assert as default dependencies ([661b1c6](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commits/661b1c6777deb29360fcf43d4d0622260bc1961d))
- add new fields for anl cdk dependencies ([f065a59](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commits/f065a5999c858982aba423bafa8e91d655a92e3a))
- correct publish release title ([47dd147](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commits/47dd14748da896bf08e6a47fed8339c9fabb88ee))
- Don't deploy if error was thrown in ANL CDK ([21f4c6b](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commits/21f4c6b116d4ea8a259017d6d85dfd3eb43de68d))
- Don't deploy if error was thrown in ANL CDK ([112fe08](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commits/112fe088665cf5d57a24f0b92a2f6d59b6272dcb))
- force publish ([ead8d5d](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commits/ead8d5d24fcb43bd843de188566ce26ae67b262c))
- implement projen for assert package ([cb02c10](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commits/cb02c10ad69527edeebee77172ce57750d650392))
- implement semantic release ([cdabac2](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commits/cdabac261a520baa89f0dfc86c53572506372b97))
- implement semantic release ([dfef8c1](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commits/dfef8c1d0da635efb20a8bbc8ce17bb8607aef39))
- improved deploy logging ([ce839f1](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commits/ce839f1f43fe853c8619ec9bd75333aaf99e66ab))
- lock file should be added in deploy environment ([bf79221](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commits/bf7922118109e339a1e9b5f8428a25f23ec867f8))
- make retrieval of the default vpc easier ([4710a1c](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commits/4710a1c638236ecb816ac41f7b0c36d2d902e4b5))
- only use peer deps ([8fa5717](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commits/8fa5717bdd116ac5dfe26893d766ffe71fcae31a))
- projen release ([253cb42](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commits/253cb428ee9bbc074c9a596a136448c6c5e0b469))
- release projen ([83846fe](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commits/83846fe286242b4312fe568139eb6e8f82463c82))
- remove anl-cdk/core from bundled dependencies ([7951d2f](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commits/7951d2ff8d6e0a7fde850b887480132450e3b606))
- Rename Aegon to AnlCdk ([3f4559e](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commits/3f4559e501a5346993f978c6c2fb30fcc2d9a691))
- resync projen with core lib ([0c8ea50](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commits/0c8ea50e31667dc00360aa1a1e75b1d7ac554e37))
- synchronize projen ([b4b7dd3](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commits/b4b7dd373aca8c1e51e25c7dc1a8eb060b9e1f13))
- test commit ([de43694](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commits/de43694db6b2026d61122a5e02de4ed48b16b356))
- test commit ([7b05e18](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commits/7b05e180f391e73da5b8575156f8c8c4429d4a0f))
- test commit ([8ce157a](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commits/8ce157ae37a025e9ca9731f0a92af38d9e3bb698))
- test commit ([4f6c13d](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commits/4f6c13d6ea98f74c914a33c488167a35bfdd8832))
- test commit ([1e25401](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commits/1e25401ca2ab689142ded71faf584d438cb01117))
- use debug template branch ([a939727](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commits/a939727e26b26f6eb891df929dcf8ccd5d59abfc))

### Features

- add waf parameter ([c53d9d2](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commits/c53d9d22925f07b4d230958735835d9a52c6af3c))
- added standard version bumping ([7e0670a](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commits/7e0670a88f4cb6d3508afaad91b95e9b219c5572))
- anl-cdk parameters ([047bf82](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commits/047bf82e25aad3b68862a908931f91a40925dfb6))
- projen project inside cdk ([6d70c73](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commits/6d70c73c1475075cbc20e1ed240c00a1818398db))
- Tag validation ([f0446ca](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commits/f0446ca25e410612857a5d51279df066f7adf185))

### Reverts

- Revert "Publish" ([94ee025](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commits/94ee025ddd14963a3292a73729dd6d16bdc6712c))

# Changelog

## [1.3.0-tf-1412.3](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/branchCompare?baseVersion=GTv1.3.0-tf-1412.2&targetVersion=GTv1.3.0-tf-1412.3&_a=files) (2021-04-12)

### Bug Fixes

- projen project url ([6b1358d](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commit/6b1358d6c7547f0477977f5d0a9a9721d6bc22d4))
- release projen ([83846fe](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commit/83846fe286242b4312fe568139eb6e8f82463c82))

## [1.3.0-tf-1412.2](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/branchCompare?baseVersion=GTv1.3.0-tf-1412.1&targetVersion=GTv1.3.0-tf-1412.2&_a=files) (2021-04-12)

### Bug Fixes

- projen release ([253cb42](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commit/253cb428ee9bbc074c9a596a136448c6c5e0b469))

## [1.3.0-tf-1412.1](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/branchCompare?baseVersion=GTv1.2.0&targetVersion=GTv1.3.0-tf-1412.1&_a=files) (2021-04-12)

### Features

- projen project inside cdk ([6d70c73](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commit/6d70c73c1475075cbc20e1ed240c00a1818398db))

## [1.2.0](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/branchCompare?baseVersion=GTv1.1.0&targetVersion=GTv1.2.0&_a=files) (2021-04-07)

### Features

- anl-cdk parameters ([047bf82](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commit/047bf82e25aad3b68862a908931f91a40925dfb6))

## [1.2.0-tf-1378.1](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/branchCompare?baseVersion=GTv1.1.0&targetVersion=GTv1.2.0-tf-1378.1&_a=files) (2021-04-07)

### Features

- anl-cdk parameters ([047bf82](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commit/047bf82e25aad3b68862a908931f91a40925dfb6))

## [1.1.0](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/branchCompare?baseVersion=GTv1.0.2&targetVersion=GTv1.1.0&_a=files) (2021-03-31)

### Features

- add waf parameter ([c53d9d2](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commit/c53d9d22925f07b4d230958735835d9a52c6af3c))

### Bug Fixes

- add additional mocks ([680a906](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commit/680a90627c2ae581f71a82f450a9329d4355b7ea))

## [1.1.0-tf-1373.2](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/branchCompare?baseVersion=GTv1.1.0-tf-1373.1&targetVersion=GTv1.1.0-tf-1373.2&_a=files) (2021-03-30)

### Bug Fixes

- add additional mocks ([680a906](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commit/680a90627c2ae581f71a82f450a9329d4355b7ea))

## [1.1.0-tf-1373.1](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/branchCompare?baseVersion=GTv1.0.2&targetVersion=GTv1.1.0-tf-1373.1&_a=files) (2021-03-29)

### Features

- add waf parameter ([c53d9d2](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commit/c53d9d22925f07b4d230958735835d9a52c6af3c))

### [1.0.2](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/branchCompare?baseVersion=GTv1.0.1&targetVersion=GTv1.0.2&_a=files) (2021-03-02)

### Bug Fixes

- force publish ([ead8d5d](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commit/ead8d5d24fcb43bd843de188566ce26ae67b262c))
- implement projen for assert package ([cb02c10](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commit/cb02c10ad69527edeebee77172ce57750d650392))
- only use peer deps ([8fa5717](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commit/8fa5717bdd116ac5dfe26893d766ffe71fcae31a))
- remove anl-cdk/core from bundled dependencies ([7951d2f](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commit/7951d2ff8d6e0a7fde850b887480132450e3b606))
- resync projen with core lib ([0c8ea50](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commit/0c8ea50e31667dc00360aa1a1e75b1d7ac554e37))
- synchronize projen ([b4b7dd3](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commit/b4b7dd373aca8c1e51e25c7dc1a8eb060b9e1f13))
- test commit ([de43694](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commit/de43694db6b2026d61122a5e02de4ed48b16b356))
- test commit ([7b05e18](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commit/7b05e180f391e73da5b8575156f8c8c4429d4a0f))
- test commit ([8ce157a](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commit/8ce157ae37a025e9ca9731f0a92af38d9e3bb698))
- test commit ([4f6c13d](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commit/4f6c13d6ea98f74c914a33c488167a35bfdd8832))
- test commit ([1e25401](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commit/1e25401ca2ab689142ded71faf584d438cb01117))
- use debug template branch ([a939727](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commit/a939727e26b26f6eb891df929dcf8ccd5d59abfc))

### [1.0.2-tf-1165.9](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/branchCompare?baseVersion=GTv1.0.2-tf-1165.8&targetVersion=GTv1.0.2-tf-1165.9&_a=files) (2021-03-02)

### Bug Fixes

- only use peer deps ([8fa5717](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commit/8fa5717bdd116ac5dfe26893d766ffe71fcae31a))

### [1.0.2-tf-1165.8](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/branchCompare?baseVersion=GTv1.0.2-tf-1165.7&targetVersion=GTv1.0.2-tf-1165.8&_a=files) (2021-03-02)

### Bug Fixes

- test commit ([de43694](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commit/de43694db6b2026d61122a5e02de4ed48b16b356))

### [1.0.2-tf-1165.7](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/branchCompare?baseVersion=GTv1.0.2-tf-1165.6&targetVersion=GTv1.0.2-tf-1165.7&_a=files) (2021-03-02)

### Bug Fixes

- test commit ([7b05e18](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commit/7b05e180f391e73da5b8575156f8c8c4429d4a0f))

### [1.0.2-tf-1165.6](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/branchCompare?baseVersion=GTv1.0.2-tf-1165.5&targetVersion=GTv1.0.2-tf-1165.6&_a=files) (2021-03-02)

### Bug Fixes

- test commit ([8ce157a](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commit/8ce157ae37a025e9ca9731f0a92af38d9e3bb698))

### [1.0.2-tf-1165.5](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/branchCompare?baseVersion=GTv1.0.2-tf-1165.4&targetVersion=GTv1.0.2-tf-1165.5&_a=files) (2021-03-02)

### Bug Fixes

- use debug template branch ([a939727](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commit/a939727e26b26f6eb891df929dcf8ccd5d59abfc))

### [1.0.2-tf-1165.4](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/branchCompare?baseVersion=GTv1.0.2-tf-1165.3&targetVersion=GTv1.0.2-tf-1165.4&_a=files) (2021-03-01)

### Bug Fixes

- test commit ([4f6c13d](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commit/4f6c13d6ea98f74c914a33c488167a35bfdd8832))
- test commit ([1e25401](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commit/1e25401ca2ab689142ded71faf584d438cb01117))

### [1.0.2-tf-1165.3](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/branchCompare?baseVersion=GTv1.0.2-tf-1165.2&targetVersion=GTv1.0.2-tf-1165.3&_a=files) (2021-03-01)

### Bug Fixes

- remove anl-cdk/core from bundled dependencies ([7951d2f](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commit/7951d2ff8d6e0a7fde850b887480132450e3b606))
- synchronize projen ([b4b7dd3](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commit/b4b7dd373aca8c1e51e25c7dc1a8eb060b9e1f13))

### [1.0.2-tf-1165.2](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/branchCompare?baseVersion=GTv1.0.2-tf-1165.1&targetVersion=GTv1.0.2-tf-1165.2&_a=files) (2021-03-01)

### Bug Fixes

- force publish ([ead8d5d](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commit/ead8d5d24fcb43bd843de188566ce26ae67b262c))

### [1.0.2-tf-1165.1](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/branchCompare?baseVersion=GTv1.0.1&targetVersion=GTv1.0.2-tf-1165.1&_a=files) (2021-03-01)

### Bug Fixes

- implement projen for assert package ([cb02c10](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commit/cb02c10ad69527edeebee77172ce57750d650392))
- resync projen with core lib ([0c8ea50](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commit/0c8ea50e31667dc00360aa1a1e75b1d7ac554e37))

### [1.0.1](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/branchCompare?baseVersion=GTv1.0.0&targetVersion=GTv1.0.1&_a=files) (2021-03-01)

### Bug Fixes

- correct publish release title ([47dd147](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commit/47dd14748da896bf08e6a47fed8339c9fabb88ee))
- implement semantic release ([cdabac2](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commit/cdabac261a520baa89f0dfc86c53572506372b97))
- implement semantic release ([dfef8c1](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commit/dfef8c1d0da635efb20a8bbc8ce17bb8607aef39))

### [1.0.1-tf-1166.3](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/branchCompare?baseVersion=GTv1.0.1-tf-1166.2&targetVersion=GTv1.0.1-tf-1166.3&_a=files) (2021-02-26)

### Bug Fixes

- implement semantic release ([cdabac2](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commit/cdabac261a520baa89f0dfc86c53572506372b97))

### [1.0.1-tf-1166.2](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/branchCompare?baseVersion=GTv1.0.1-tf-1166.1&targetVersion=GTv1.0.1-tf-1166.2&_a=files) (2021-02-26)

### Bug Fixes

- correct publish release title ([47dd147](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commit/47dd14748da896bf08e6a47fed8339c9fabb88ee))

### [1.0.1-tf-1166.1](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/branchCompare?baseVersion=GTv1.0.0&targetVersion=GTv1.0.1-tf-1166.1&_a=files) (2021-02-26)

### Bug Fixes

- implement semantic release ([dfef8c1](https://dev.azure.com/aegon-nl/apidas/_git/anl-cdk/commit/dfef8c1d0da635efb20a8bbc8ce17bb8607aef39))
`;
