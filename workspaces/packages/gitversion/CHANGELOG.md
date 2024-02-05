
# Changelog

All notable changes to this project will be documented in this file


## [0.0.24](https://github.com/cp-utils/gitversion/compare/v0.0.23...v0.0.24) (Mon Feb 05 2024)

### fix

* Missing await ([aa57130](https://github.com/cp-utils/gitversion/commit/aa57130e1b49755e5483e04be252eb1a279879b5))

## [0.0.22](https://github.com/cp-utils/gitversion/compare/v0.0.21...v0.0.22) (Mon Feb 05 2024)

### fix

* Npm and invalid origin reset ([8264003](https://github.com/cp-utils/gitversion/commit/826400353f725a902ac5577f9ac45b1697390165))

## [0.0.21](https://github.com/cp-utils/gitversion/compare/v0.0.20...v0.0.21) (Mon Feb 05 2024)

### fix

* Follow existing eol at end of file ([d6333fa](https://github.com/cp-utils/gitversion/commit/d6333fa3630405d9b1ccbf1c470a75ed2c3db645))

## [0.0.20](https://github.com/cp-utils/gitversion/compare/v0.0.0...v0.0.20) (Sun Feb 04 2024)

### fix

* **pipeline** Removed fetch depth and reset versions ([eafee1b](https://github.com/cp-utils/gitversion/commit/eafee1b732b333b1d4c7af9204533d8798e07de3))

* **test** Test with merge message ([faa6ab1](https://github.com/cp-utils/gitversion/commit/faa6ab156a292f4b673d803f5ed7f20d0fdb7253))

* Pack status ([69429ec](https://github.com/cp-utils/gitversion/commit/69429eca2e6bb0846f57dba2c72780418e45da59))

* Testing with github actions ([d6141af](https://github.com/cp-utils/gitversion/commit/d6141afcab377e70234aeaf057fbfe94186dba9e))

* Fixed git urls on github actions ([1009e17](https://github.com/cp-utils/gitversion/commit/1009e17a8279fc25a193a3c5ef2566fccc5705fc))

* Lazy search ([cb8cff3](https://github.com/cp-utils/gitversion/commit/cb8cff39d8336743023e23e96ded63d10c97c521))

* Github compare link ([2150b54](https://github.com/cp-utils/gitversion/commit/2150b542b93ada9adec84f9eb59a3e7c54ba2e12))

* **release** Always publish license ([52529e4](https://github.com/cp-utils/gitversion/commit/52529e4f36c75eb8bbd50028a2f04c946b2ec9d9))

* License field ([83d3912](https://github.com/cp-utils/gitversion/commit/83d391234273b9515b4db6f73648f9446cf6cbe8))

* readme assets ([a4ff2ad](https://github.com/cp-utils/gitversion/commit/a4ff2ad3725f5012c16b07f5f9fc4346fcafffb8))

* Check for shallow repository ([372027f](https://github.com/cp-utils/gitversion/commit/372027f1edfa724cfe0da959c9db9102ac82e9b8))

* Add changelog to file list of package ([f7955f9](https://github.com/cp-utils/gitversion/commit/f7955f9a43971d91557c969bffcdea3f5194c0cc))

* Changelog generation and parsing ([0816061](https://github.com/cp-utils/gitversion/commit/0816061d3cb9ec27d4ff46d9b1d615ad6ad8ddaf))

* Bumptype parameter in bump ([e7a47da](https://github.com/cp-utils/gitversion/commit/e7a47da7f0faee4de9d8daf38a5a6ba830871dbf))

* Bump priority ([38b84d0](https://github.com/cp-utils/gitversion/commit/38b84d059ec76d392a84217dbecb5307db4ff78f))

* Changelog filename ([03226a5](https://github.com/cp-utils/gitversion/commit/03226a54d12268cc7142f79455d5baae24c1267a))

* Push tags before changelog so we still have a tagged release when something happens. Should be refactored to get a bit cleaner ([77bdb8c](https://github.com/cp-utils/gitversion/commit/77bdb8cd66bddb39265979ba01df68d78b4eca58))

* Jest ([bdb5115](https://github.com/cp-utils/gitversion/commit/bdb5115c4dc6daabc5a0b9d6d275d1b09c843040))

* Fixes after param changes ([c9db1cb](https://github.com/cp-utils/gitversion/commit/c9db1cb2ea9212a5feb97eb95a9a7016f13d4e65))

* TSC Errors ([b049b9e](https://github.com/cp-utils/gitversion/commit/b049b9ecae618d4efcffe159c75cc7a5ae3dc862))

* Linting ([56c98e3](https://github.com/cp-utils/gitversion/commit/56c98e35f8b24ab68361fc3f47c510b691662633))

### feat

* Basic logic ([d80772f](https://github.com/cp-utils/gitversion/commit/d80772fc419b5ff882f474fa4fe6f9bea0944020))

* Added commands ([b70966d](https://github.com/cp-utils/gitversion/commit/b70966d338552d9be55620c8809eb103cb55414f))

* First release (#23) ([f9b97fb](https://github.com/cp-utils/gitversion/commit/f9b97fba8a1ff8b66e1682997a5308159ca13b24))

* Added git status checks. Now breaks of when the steps can't be matched by gitstatus (#26) ([b0f593e](https://github.com/cp-utils/gitversion/commit/b0f593e594d5cd571f5f9f0aff11e16b637c7e08))

* platform plugins (#27) ([3f15c0d](https://github.com/cp-utils/gitversion/commit/3f15c0d0555dcb985d7e36dc91f5d7f753e45f13))

* Allow explicit versions and bump types ([7541f21](https://github.com/cp-utils/gitversion/commit/7541f21d89a007e3a7cf38de47574f4a2699211d))

* Plugin management ([28fae48](https://github.com/cp-utils/gitversion/commit/28fae48dc211a2197a7120e6081ab479647a9762))

* Added parsed commits to manifest in order to improve release plugins ([f0c9717](https://github.com/cp-utils/gitversion/commit/f0c9717d4bc6c3eca25a79f997c7b2fa59a1c8a8))

* Teams plugin detects independent versioning now ([32a2daa](https://github.com/cp-utils/gitversion/commit/32a2daa7bdc229e3a99a1fc6f3b5e7f7a4a6603a))

* Extracted yarn in the yarn package manager plugin ([35c3362](https://github.com/cp-utils/gitversion/commit/35c3362e198cd8d9f82b35b97e465a76e5edeeaa))

* NPM Plugin ([2d0f6f9](https://github.com/cp-utils/gitversion/commit/2d0f6f976420ff6e1ecd410de8500615ee76e3b9))

### licence

* Updated licence ([c9f9e50](https://github.com/cp-utils/gitversion/commit/c9f9e50ed67657e6710bfc48fa170fd0775383bc))

### docs

* Added homepage ([642fe6b](https://github.com/cp-utils/gitversion/commit/642fe6b4e6532a63d499cc4895c2160c79d65a67))

* Added keywords ([e2a46f5](https://github.com/cp-utils/gitversion/commit/e2a46f5cedb2b31c875517deb1cd1a19ad66beec))

### refactor

* **workspaces** Extracted IWorkspace and IProject interfaces ([ecf960a](https://github.com/cp-utils/gitversion/commit/ecf960a1675b7294f5436daf114ceed5903fb124))

* **core** Plugins with configuration + IConfiguration interface extraction ([1468559](https://github.com/cp-utils/gitversion/commit/14685595988d26c635bcb38c0517611ebbb5bfb1))

* Refactored configuration and project initialization ([9f14c46](https://github.com/cp-utils/gitversion/commit/9f14c466a5139374d68ba0d19193e3d444097a26))

* Default locations of properties ([cc30097](https://github.com/cp-utils/gitversion/commit/cc300974f7316b960345d81eb9f420c60ef35e9a))

* Extracted project to be a plugin based nodeproject and prepare for other project types ([cfefcf1](https://github.com/cp-utils/gitversion/commit/cfefcf146c2c4c8ab5b3d13638f60e8be77c1bee))

* **plugins** Change plugin initialization for build-in plugins ([1087046](https://github.com/cp-utils/gitversion/commit/10870460fa1968c67e72308d1113269693190d23))

* Dryrun inside persisting actions ([0de0782](https://github.com/cp-utils/gitversion/commit/0de0782b2b254295062e8d7d1043631a114846ac))

* Used the context a bit better ([0a0f586](https://github.com/cp-utils/gitversion/commit/0a0f586017aa2321c5a939a4feedea2de026ada8))

* Removed global logger ([064d4cc](https://github.com/cp-utils/gitversion/commit/064d4cc3089b0f0a0adf10588c8165982a0986ff))

* cleanup some logger refs ([c964081](https://github.com/cp-utils/gitversion/commit/c9640819fe49127ab560e4ea1526d6690b331299))

### chore

* changelog test and parameter simplification ([a814c61](https://github.com/cp-utils/gitversion/commit/a814c61f806c56e33505ad0746cbdbf218970bd0))

## [0.0.19](https://github.com/cp-utils/gitversion/compare/v0.0.18...v0.0.19) (Sat Feb 03 2024)

### feat

* Extracted yarn in the yarn package manager plugin ([35c3362](https://github.com/cp-utils/gitversion/commit/35c3362e198cd8d9f82b35b97e465a76e5edeeaa))

## [0.0.18](https://github.com/cp-utils/gitversion/compare/v0.0.17...v0.0.18) (Fri Feb 02 2024)

### refactor

* Refactored configuration and project initialization ([9f14c46](https://github.com/cp-utils/gitversion/commit/9f14c466a5139374d68ba0d19193e3d444097a26))

* Default locations of properties ([cc30097](https://github.com/cp-utils/gitversion/commit/cc300974f7316b960345d81eb9f420c60ef35e9a))

* Extracted project to be a plugin based nodeproject and prepare for other project types ([cfefcf1](https://github.com/cp-utils/gitversion/commit/cfefcf146c2c4c8ab5b3d13638f60e8be77c1bee))

* **plugins** Change plugin initialization for build-in plugins ([1087046](https://github.com/cp-utils/gitversion/commit/10870460fa1968c67e72308d1113269693190d23))

### fix

* Jest ([bdb5115](https://github.com/cp-utils/gitversion/commit/bdb5115c4dc6daabc5a0b9d6d275d1b09c843040))

## [0.0.17](https://github.com/cp-utils/gitversion/compare/v0.0.16...v0.0.17) (Fri Feb 02 2024)

### fix

* Push tags before changelog so we still have a tagged release when something happens. Should be refactored to get a bit cleaner ([77bdb8c](https://github.com/cp-utils/gitversion/commit/77bdb8cd66bddb39265979ba01df68d78b4eca58))

## [0.0.15](https://github.com/cp-utils/gitversion/compare/v0.0.14...v0.0.15) (Wed Jan 31 2024)

### fix

* Changelog generation and parsing ([0816061](https://github.com/cp-utils/gitversion/commit/0816061d3cb9ec27d4ff46d9b1d615ad6ad8ddaf))

## [0.0.14](https://github.com/cp-utils/gitversion/compare/v0.0.13...v0.0.14) (Wed Jan 31 2024)

### fix

* Add changelog to file list of package ([f7955f9](https://github.com/cp-utils/gitversion/commit/f7955f9a43971d91557c969bffcdea3f5194c0cc))

## [0.0.13](https://github.com/cp-utils/gitversion/compare/v0.0.12...v0.0.13) (Wed Jan 31 2024)

### feat

* Teams plugin detects independent versioning now ([32a2daa](https://github.com/cp-utils/gitversion/commit/32a2daa7bdc229e3a99a1fc6f3b5e7f7a4a6603a))

### fix

* Check for shallow repository ([372027f](https://github.com/cp-utils/gitversion/commit/372027f1edfa724cfe0da959c9db9102ac82e9b8))

## [0.0.12](https://github.com/cp-utils/gitversion/compare/v0.0.11...v0.0.12) (Tue Jan 30 2024)

### fix

* readme assets ([a4ff2ad](https://github.com/cp-utils/gitversion/commit/a4ff2ad3725f5012c16b07f5f9fc4346fcafffb8))

## [0.0.11](https://github.com/cp-utils/gitversion/compare/v0.0.10...v0.0.11) (Tue Jan 30 2024)

### fix

* License field ([83d3912](https://github.com/cp-utils/gitversion/commit/83d391234273b9515b4db6f73648f9446cf6cbe8))

## [0.0.10](https://github.com/cp-utils/gitversion/compare/v0.0.9...v0.0.10) (Tue Jan 30 2024)

### fix

* **release** Always publish license ([52529e4](https://github.com/cp-utils/gitversion/commit/52529e4f36c75eb8bbd50028a2f04c946b2ec9d9))

## [0.0.9](https://github.com/cp-utils/gitversion/compare/v0.0.8...v0.0.9) (Tue Jan 30 2024)

### feat

* Plugin management ([28fae48](https://github.com/cp-utils/gitversion/commit/28fae48dc211a2197a7120e6081ab479647a9762))

* Added parsed commits to manifest in order to improve release plugins ([f0c9717](https://github.com/cp-utils/gitversion/commit/f0c9717d4bc6c3eca25a79f997c7b2fa59a1c8a8))

### licence

* Updated licence ([c9f9e50](https://github.com/cp-utils/gitversion/commit/c9f9e50ed67657e6710bfc48fa170fd0775383bc))

### docs

* Added homepage ([642fe6b](https://github.com/cp-utils/gitversion/commit/642fe6b4e6532a63d499cc4895c2160c79d65a67))

## [0.0.8](https://github.com/cp-utils/gitversion/compare/v0.0.7...v0.0.8) (Fri Jan 26 2024)

### fix

* Github compare link ([2150b54](https://github.com/cp-utils/gitversion/commit/2150b542b93ada9adec84f9eb59a3e7c54ba2e12))

## [0.0.7](https://github.com/cp-utils/gitversion/compare/0.0.6...0.0.7) (Fri Jan 26 2024)

### feat

* Allow explicit versions and bump types ([7541f21](https://github.com/cp-utils/gitversion/commit/7541f21d89a007e3a7cf38de47574f4a2699211d))

## [0.0.5](https://github.com/not_initialized/not_initialized/compare/0.0.4...0.0.5) (Fri Jan 26 2024)

### fix

* Pack status ([69429ec](https://github.com/not_initialized/not_initialized/commit/69429eca2e6bb0846f57dba2c72780418e45da59))

## [0.0.4](https://github.com///compare/0.0.3...0.0.4) (Fri Jan 26 2024)

### feat

* platform plugins (#27) ([3f15c0d](https://github.com///commit/3f15c0d0555dcb985d7e36dc91f5d7f753e45f13))

## [0.0.4-platform-plugins.0](https://github.com/cp-utils/gitversion/compare/0.0.3...0.0.4-platform-plugins.0) (Fri Jan 26 2024)

### feat

* pltform plugin basics ([0e6c5f6](https://github.com/cp-utils/gitversion/commit/0e6c5f6e17c703a4359f84f12e3e43d127a55406))

## [0.0.4-platform-plugins.0](https://github.com/cp-utils/gitversion/compare/0.0.3...0.0.4-platform-plugins.0) (Fri Jan 26 2024)

### feat

* pltform plugin basics ([0e6c5f6](https://github.com/cp-utils/gitversion/commit/0e6c5f6e17c703a4359f84f12e3e43d127a55406))
