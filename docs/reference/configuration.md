---
outline: deep
---

# Configuration

Gitversion is build in a way that it should auto detect any kind of configuration and from this work completely from information stored in git.
However, sometimes you just want to have a flow slightly different from the default or introduce custom workings through plugins. 

## Location and format

Gitversion currently searches for the following file:

```sh
<<project root>>/.gitversion.cjs
```

This has to be a commonjs file with the following basics:

```js
const { defineConfig } = require("gitbump");

module.exports = defineConfig({
  // configuration options
})

```

::: tip
You do not need to use the imported defineConfig function as long as the return value matches the config. This is mainly used to add code completion for config items 
:::

## Common settings

### Independent versioning

| <!-- -->    | <!-- -->    |
|-|-|
| Name | independentVersioning |
| Type | boolean |
| Default | false |

With independent versioning enabled gitversion will keep track of each workspace individually. Instead of one global version tag it will generate version tags per (public) workspace.

Bumps will also work per workspace. This means that it will track conventional commit messages on git changes in the relative working folder of the workspace.

::: tip
This means that it can happen that on a release there is a major bump for one package a minor for another and no publish for event another one
:::

Changelogs are always generated on a per workspace base. Therefor independent versioning has no effect on changelog generation.

::: details Example .gitversion.cjs
```js
const { defineConfig } = require("gitbump");

module.exports = defineConfig({
  independentVersioning: true
})

```
:::


### Feature bump behavior

| <!-- -->    | <!-- -->    |
|-|-|
| Name | featureBumpBehavior |
| Type | 'normal' or 'always' or 'never' |
| Default | 'never' |

Working with feature branch types can be different per way of working or even per project. 
This setting tells gitversion what to do when bumping a feature branch. There are 3 options:

| Option | Behavior |
| - | - |
| 'normal' | Feature branches are published based on conventional commit git messages |
| 'never' | Bumping a feature branch will always result in 'NONE'. This way you will not get any publications for the feature branch |
| 'always' | Bumping a feature branch will always result in a 'PATCH' bump. This is usefull when you have a continues workflow where you like to be able to share your feature with the feature requestor |

See more about branch types in [working with branches](../how-to/working-with-branches.md) to see how feature branch types fit in the the gitversion way of working.

::: details Example .gitversion.cjs
```js
const { defineConfig } = require("gitbump");

module.exports = defineConfig({
  featureBumpBehavior: 'always'
})

```
:::


### Main branch patterns

| <!-- -->    | <!-- -->    |
|-|-|
| Name | mainBranchPatterns |
| Type | regex-string array |
| Default | <pre>[<br>&nbsp;&nbsp;'^(main)$', <br>&nbsp;&nbsp;'^(master)$', <br>] </pre> |

Main branch detection. You can use multiple patterns. The first match will be used.

The regex should return exactly 1 group which is used for the naming convention inside gitversion

See more about branch types in [working with branches](../how-to/working-with-branches.md)

::: details Example .gitversion.cjs

```js
const { defineConfig } = require("gitbump");

module.exports = defineConfig({
  mainBranchPatterns: [
    '^(main)$',
    '^(main-legacy)$'
  ]
})

```

:::

### Release branch patterns

| <!-- -->    | <!-- -->    |
|-|-|
| Name | releaseBranchPatterns |
| Type | regex-string array |
| Default | <pre>[<br>&nbsp;&nbsp;'^release/(.*)$', <br>] </pre> |

Release branch detection. You can use multiple patterns. The first match will be used.

The regex should return exactly 1 group which is used for the naming convention inside gitversion

See more about branch types in [working with branches](../how-to/working-with-branches.md)

::: details Example .gitversion.cjs

```js
const { defineConfig } = require("gitbump");

module.exports = defineConfig({
  releaseBranchPatterns: [
    '^release/(.*)$',
    '^(next)$',
    '^(alpha)$',
    '^(beta)$',
  ]
})

```

:::
### Feature branch patterns

| <!-- -->    | <!-- -->    |
|-|-|
| Name | featureBranchPatterns |
| Type | regex-string array |
| Default | <pre>[<br>&nbsp;&nbsp;'^feature/(.&ast;)$',<br>&nbsp;&nbsp;'^bugfix/(.&ast;)$',<br>&nbsp;&nbsp;'^hotfix/(.&ast;)$',<br>] </pre> |

Release branch detection. You can use multiple patterns. The first match will be used.

The regex should return exactly 1 group which is used for the naming convention inside gitversion

See more about branch types in [working with branches](../how-to/working-with-branches.md)

::: details Example .gitversion.cjs

```js
const { defineConfig } = require("gitbump");

module.exports = defineConfig({
  featureBranchPatterns: [
    '^feature/(.*)$',
    '^(gh-.*)$',
    '^(issue-.*)$',
    '^(fix-.*)$',
  ]
})

```

:::

### dry run

| <!-- -->    | <!-- -->    |
|-|-|
| Name | dryRun |
| Type | boolean |
| Default | false |

This will be used by all permanent actions to only run the logic without actually executing actions like "commit" and "push". This option is also aways available through the cli options.

::: details Example .gitversion.cjs
```js
const { defineConfig } = require("gitbump");

module.exports = defineConfig({
  dryRun: true
})

```
:::

### Version tag prefix

| <!-- -->    | <!-- -->    |
|-|-|
| Name | versionTagPrefix |
| Type | string |
| Default | 'v' |

Every tag in gitversion is prefixed. By default this is 'v' to get 'v1.0.0'. You can change this to your own needs

::: details Example .gitversion.cjs
```js
const { defineConfig } = require("gitbump");

module.exports = defineConfig({
  versionTagPrefix: 'version-'
})

```
:::
