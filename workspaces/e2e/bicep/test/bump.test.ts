import { readFile, rmdir, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { simpleGit, SimpleGit } from 'simple-git';
import { $ } from 'zx';

const rootFolder = `${__dirname}/..`;
const git: SimpleGit = simpleGit({
  baseDir: rootFolder,
});

async function workspaceVersion(workspace: string): Promise<string> {
  const fileName = join(workspace, 'metadata.json');
  if (!existsSync(fileName)) {
    throw new Error(`Metadata file not found in workspace: ${workspace}`);
  }
  const content = await readFile(fileName, 'utf-8');
  const metadata = JSON.parse(content);
  if (!metadata.version) {
    throw new Error(`Version not found in metadata file: ${fileName}`);
  }
  return metadata.version;
}

async function addChange(workspace: string): Promise<void> {
  const fileName = join(workspace, 'changes.txt');

  await writeFile(fileName, `${Date.now()}`, 'utf-8');
  await git.add([fileName]);
}

beforeAll(async () => {
  if (existsSync(join(rootFolder, '.git'))) {
    await rmdir(join(rootFolder, '.git'), { recursive: true });
  }
  await git.init();
  await git.add(['.gitversion.cjs']);
  await git.commit('feat: init');
  await git.addTag('v1.0.0');

  await git.add(['workspaces/package-a/*']);
  await git.commit('feat: Added package a');
  await git.add(['workspaces/package-b/*']);
  await git.commit('fix: Added package b');
  await $`yarn gitversion bump`;
  await $`yarn gitversion pack`;
  await $`yarn gitversion tag --force`;
});

it('should have valid starting versions', async () => {
  expect(await workspaceVersion(join(rootFolder, 'workspaces', 'package-a'))).toBe('1.1.0');
  expect(await workspaceVersion(join(rootFolder, 'workspaces', 'package-b'))).toBe('1.0.1');
});

it('should bump package a and fix-bump package-b', async () => {
  await addChange(join(rootFolder, 'workspaces', 'package-a'));
  await git.commit('feat!: Breaking change for package a');
  await $`yarn gitversion bump`;
  expect(await workspaceVersion(join(rootFolder, 'workspaces', 'package-a'))).toBe('2.0.0');
  expect(await workspaceVersion(join(rootFolder, 'workspaces', 'package-b'))).toBe('1.0.2');
  await $`yarn gitversion pack`;
  await $`yarn gitversion tag --force`;
});
