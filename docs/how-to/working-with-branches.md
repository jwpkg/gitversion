# How to work with branches

The short answer: "It's up to you".

The longer answer is: It does not matter, you choose your branching strategy. Gitversion does not enforce or provide a branching strategy.
There are some tips how to work with branches though.

## Branch types gitversion uses

Gitversion itself detects 3 types of branches:

- main
- release
- feature

These branch types have nothing to do with the branching strategies of common patterns like [Gitflow](https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow) or [Trunk based development](https://trunkbaseddevelopment.com/). However they can work seamless with gitversion.

The 3 branch types are used by gitversion to make decissions about the following release concepts:

- version structure (**1.0.0** or **1.0.0-\<\<name>>.\<\<count>>**)
- release channel (**'latest'** or **\<\<name>>**)
- changelog generation
- release or not release

By default it will detect the following but this can be completely customized:

| Branch name | Branch type | Version | Channel | Changelog | Release |
|-|-|-|-|-|-|
| main | main | 1.0.0 | latest | Yes | Yes |
| master | main | 1.0.0 | latest | Yes | Yes |
| releases/next | release | 1.0.0&#8209;next.0 | next | Yes | Yes |
| releases/alpha | release | 1.0.0&#8209;alpha.0 | alpha | Yes | Yes |
| feature/add&#8209;theme | feature | 1.0.0&#8209;add&#8209;theme.0 | add-theme | No | Depends&nbsp;* |
| feature/GH&#8209;1234 | feature | 1.0.0&#8209;GH&#8209;1234.0 | GH-1234 | No |  Depends&nbsp;* |
| hotfix/bug&#8209;abcd | feature | 1.0.0&#8209;bug&#8209;abcd.0 | bug-abcd | No  | Depends&nbsp;* |
| bugfix/gh&#8209;0000 | feature | 1.0.0&#8209;gh&#8209;0000.0 | gh-0000 | No | Depends&nbsp;* |
| develop | none | none | none | No | no |

::: info
For feature branch types you can define the way its deployed. This often depends on your way of working. See [featureBumpBehavior](../reference/configuration.md#featureBumpBehavior)
:::

## Commits and merges

Eventhough gitversion does not enfore a branching strategy we have some tips depending on the branch type your working on.

### Squash merge Feature branch types

::: tip
Always use squash merge to merge a feature branch into a release type branch (release/main).
:::

In a lot of other versioning concepts where [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/) the recommendation is to make sure every commit follows the standard.

In practice this often fails. The main reason is that you see a commit history like this:

```
> feat: Added radio button
> fix: Fixed the new radio button
> fix: Now the radio button really works
> feat: Added styling to the new radio button
> fix: Corrected a typo
....
```

The above is not even wrong but during development you keep changing stuff until you are happy with it. So just commit with messages like this:

```
> feat: added radio
> some fixes
> oops made a typo
> committed daily status
> finalized the radio
```

After this you create a pull request into a release branch (either a main type or release type). Make sure the pull request is properly named like:

title
```
feat: Added the radio button to the default theme 
```

description
```
The theme now supports stylable radio buttons. You can use them as follows:

\`\`\`
import Radio from 'theme';

<Radio>
  <Option>One</Option>
  <Option>Two</Option>
</Radio>
\`\`\`

closes #1234
```

Now if you squash merge the pull request the feature will be added to the release as a whole. This will make sure:
- changelog is properly updated with only 1 feature
- compare and commit links in the changelog will actually show the exact change
