# Contributing to gitbump

Nice of you to join te gitbump repository. In order to get started I'd like to explain the basic setups of the repo

You can read about the way gitbump works at [the documentation site](https://www.cp-utils.com/projects/gitversion/).

## Getting started

> Read [Repo setup](#repo-setup) to get yourself familiar with the key concepts

clone/fork

Install the packages by executing yarn in the repository root:
``` sh
$ yarn 
```

Verify if everything works as expected:

``` sh
$ yarn gitbump check
$ yarn gitbump bump
$ yarn gitbump pack 
$ yarn gitbump publish --dry-run
$ yarn gitbump reset
```

## Repo setup

The repository setup has the following key elements:

- [yarn 4 (berry) package manager](#yarn)
- [Typescript only](#typescript)
- [Gitbump release](#gitbump)
- [Jest based unit testing](#jest)
- [Eslint linter](#eslint)

### Yarn

The repository is a yarn berry workspace setup (monorepo). This means we use [yarn](https://yarnpkg.com/) to manage dependencies.
Yarn berry operates in [pnp](https://yarnpkg.com/features/pnp) mode so we never have any heavy node_module folders.

We also use yarn [constraints](https://yarnpkg.com/features/constraints) for consistency of packages dependencies and generation of mandatory fields. Please read into this concept if you are not familiar with it.

### Typescript

All source code in the repo is [typescript](https://www.typescriptlang.org/). The only exception for this are (small) configuration files. 

There should never be any need to have any javascript available during development time. The only time we have javascript is during the pack command of the actual production package. You can see this in action in [workspaces/packages/gitbump/package.json](workspaces/packages/gitbump/package.json) where we have basically this:

```json 
"scripts": {
  "prepack": "tsc --noEmit false", // Execute typescript with the option to emit teh output before we pack
  "postpack": "rm -rf lib"         // Remove the generated files to cleanup the workspace
}
```
And we use this to be able to use gitbump itself in typescript mode:
```json
"bin": "bin/index-typescript.js",
"main": "src/index.ts",
"types": "src/index.ts",
"publishConfig": {
    "main": "./lib/index.js",
    "types": "./lib/index.d.ts",
    "bin": "bin/index.js"
},
```

### Gitbump

Of course we use gitbump itself in the repo. We use it in the default mode and execute it with the above helpers in combination with [ts-node](https://www.npmjs.com/package/ts-node)

### Jest

Jest is used for unit testing. We basically have the following config defaults:
```sh
source-file.ts
source-file._test_.ts
```

This way your test file is always directly located next to your source file. 
> Test files are not included in the generated package

### Eslint

We use eslint with the default @cp-utils/eslint config rules to keep our code styling consistent
