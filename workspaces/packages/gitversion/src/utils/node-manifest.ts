import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import * as t from 'typanion';

export const isNodeManifest = t.isPartial({
  version: t.isOptional(t.isString()),
  name: t.isString(),
  private: t.isOptional(t.isBoolean()),
  workspaces: t.isOptional(t.isArray(t.isString())),
});

export type NodeManifest = t.InferType<typeof isNodeManifest>;

const NODE_MANIFEST_NAME = 'package.json';

export async function loadManifest(folder: string): Promise<NodeManifest> {
  const content = JSON.parse(await readFile(join(folder, NODE_MANIFEST_NAME), 'utf-8'));
  const errors: string[] = [];
  if (isNodeManifest(content, { errors })) {
    return content;
  }
  throw new Error(`Invalid manifest in ${folder}: ${errors}`);
}

export async function persistManifest(folder: string, manifest: NodeManifest) {
  await writeFile(join(folder, NODE_MANIFEST_NAME), JSON.stringify(manifest), 'utf-8');
}
