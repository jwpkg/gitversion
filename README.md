# Gitversion 

## introduction

Gitversion is a complete git-based release management tool. This was created because I always find myself struggling to work with the existing tools.

Gitversion has the following key elements:
- Default monorepo support
  - 1 version for every package
  - individual versions per package
- Split flow for bump, pack and publish
- Conventional commits
- Build for CI/CD while still allowing testing manual
- (pre) release channels based on git branch
- Feature releases
- No versions needed in package.json (preventing merge conflicts)
- Promotes pull requests to follow conventional commits

## Installation

> yarn add -D @cp-utils/gitversion

## Commands

### Bump
> yarn gitversion bump

This will: 
- read the current version(s) from the git repo (using tags)
- bump the version(s) based on found conventional commit messages
- store the version in the package.json files of the packages

### Pack
> yarn gitversion pack

This will:
- Run the pack command of the currently detected package manager per workspace.
- store the generated .tgz files in the ***gitversion.out*** folder

### Publish
> yarn gitversion publish

This will:
- read the contents of the ***gitversion.out** folder
- publish the packages to the registry
- update the changelogs and commit them
- tag the current version(s)
- push to the origin

>> Note: Due to the ***gitversion.out*** folder pack and publish can be executed in different jobs. This enables running parallel jobs together with pack/build before publishing (i.e. end-to-end tests jobs and code quality jobs)
