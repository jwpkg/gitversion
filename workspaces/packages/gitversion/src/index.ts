import { runExit } from 'clipanion';

import { BumpCommand } from './commands/bump';
import { ResetCommand } from './commands/reset';
import { RestoreCommand } from './commands/restore';

// async function main() {
//   const git = new Git(process.cwd());
//   console.log(await git.logs());//'7abaf0af0a37532f063c92db4b7620782c0d7e2f'));
//   console.log(await git.versionTags());
//   console.log(await git.currentBranch());

//   const project = await Project.load(await gitRoot());
//   console.log(project);
//   // const yarnConfig = await Configuration.find(ppath.resolve(process.cwd()), getPluginConfiguration());

//   // const { project } = await Project.find(yarnConfig, ppath.resolve(process.cwd()));
//   // console.log(project.topLevelWorkspace.manifest);
// }

// main().then(() => {
//   console.log('done');
// });

runExit([
  BumpCommand,
  ResetCommand,
  RestoreCommand,
]);
