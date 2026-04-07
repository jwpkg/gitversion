import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

import { BumpManifestGitStatus } from './bump-manifest';
import { IConfiguration } from './configuration';
import { Git } from './git';
import { PackArtifact, PackManifestContent } from './pack-artifact';

const FAKE_HASH = 'abc1234';

function makeGitMock(): Git {
  return {
    gitStatusHash: jest.fn().mockResolvedValue(FAKE_HASH),
  } as unknown as Git;
}

function makeConfig(stagingFolder: string): IConfiguration {
  return {
    stagingFolder,
    packFolder: join(stagingFolder, 'pack'),
  } as unknown as IConfiguration;
}

const bumpGitStatus: BumpManifestGitStatus = {
  preBump: FAKE_HASH,
  postBump: FAKE_HASH,
};

describe('PackArtifact', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'pack-artifact-test-'));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  describe('republish flag', () => {
    test('defaults to false when not set', async () => {
      const git = makeGitMock();
      const config = makeConfig(tmpDir);
      const artifact = await PackArtifact.new(config, git, bumpGitStatus);
      expect(artifact.republish).toBe(false);
    });

    test('is true when passed to new()', async () => {
      const git = makeGitMock();
      const config = makeConfig(tmpDir);
      const artifact = await PackArtifact.new(config, git, bumpGitStatus, true);
      expect(artifact.republish).toBe(true);
    });

    test('round-trips through persist and load', async () => {
      const git = makeGitMock();
      const config = makeConfig(tmpDir);
      const artifact = await PackArtifact.new(config, git, bumpGitStatus, true);
      await artifact.persist();

      const loaded = await PackArtifact.load(config, git);
      expect(loaded).not.toBeNull();
      expect(loaded!.republish).toBe(true);
    });

    test('round-trips as false (not written to JSON when false)', async () => {
      const git = makeGitMock();
      const config = makeConfig(tmpDir);
      const artifact = await PackArtifact.new(config, git, bumpGitStatus, false);
      await artifact.persist();

      const loaded = await PackArtifact.load(config, git);
      expect(loaded).not.toBeNull();
      expect(loaded!.republish).toBe(false);
    });

    test('false is not written to JSON (keeps file clean)', async () => {
      const { readFile } = await import('fs/promises');
      const git = makeGitMock();
      const config = makeConfig(tmpDir);
      const artifact = await PackArtifact.new(config, git, bumpGitStatus, false);
      await artifact.persist();

      const packManifestFile = join(tmpDir, 'pack', 'pack-manifest.json');
      const raw = JSON.parse(await readFile(packManifestFile, 'utf-8')) as PackManifestContent;
      expect(raw.republish).toBeUndefined();
    });

    test('true is written to JSON', async () => {
      const { readFile } = await import('fs/promises');
      const git = makeGitMock();
      const config = makeConfig(tmpDir);
      const artifact = await PackArtifact.new(config, git, bumpGitStatus, true);
      await artifact.persist();

      const packManifestFile = join(tmpDir, 'pack', 'pack-manifest.json');
      const raw = JSON.parse(await readFile(packManifestFile, 'utf-8')) as PackManifestContent;
      expect(raw.republish).toBe(true);
    });
  });

  describe('validateGitStatusForPublish', () => {
    test('passes when all hashes match (republish scenario)', async () => {
      const git = makeGitMock();
      const config = makeConfig(tmpDir);
      const artifact = await PackArtifact.new(config, git, bumpGitStatus, true);
      await artifact.persist();

      const valid = await artifact.validateGitStatusForPublish();
      expect(valid).toBe(true);
    });
  });
});
