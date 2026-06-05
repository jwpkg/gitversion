import { topoSort } from './topo-sort';
import { IWorkspace } from './workspace-utils';

function makeWorkspace(packageName: string, deps: string[] = []): IWorkspace {
  return {
    packageName,
    workspaceDependencies: deps,
  } as unknown as IWorkspace;
}

describe('topoSort', () => {
  it('returns empty array for empty input', () => {
    expect(topoSort([])).toEqual([]);
  });

  it('returns single workspace in one level', () => {
    const a = makeWorkspace('a');
    expect(topoSort([a])).toEqual([[a]]);
  });

  it('linear chain: dependency before dependent', () => {
    const a = makeWorkspace('a');
    const b = makeWorkspace('b', ['a']);
    const c = makeWorkspace('c', ['b']);
    const levels = topoSort([c, b, a]);
    expect(levels).toHaveLength(3);
    expect(levels[0]).toEqual([a]);
    expect(levels[1]).toEqual([b]);
    expect(levels[2]).toEqual([c]);
  });

  it('diamond: shared dep in level 0, both consumers in level 1, final in level 2', () => {
    const shared = makeWorkspace('shared');
    const left = makeWorkspace('left', ['shared']);
    const right = makeWorkspace('right', ['shared']);
    const top = makeWorkspace('top', ['left', 'right']);
    const levels = topoSort([top, right, left, shared]);
    expect(levels[0]).toEqual([shared]);
    expect(levels[1]).toHaveLength(2);
    expect(levels[1]).toEqual(expect.arrayContaining([left, right]));
    expect(levels[2]).toEqual([top]);
  });

  it('disconnected graph: independent workspaces in the same level', () => {
    const a = makeWorkspace('a');
    const b = makeWorkspace('b');
    const levels = topoSort([a, b]);
    expect(levels).toHaveLength(1);
    expect(levels[0]).toHaveLength(2);
    expect(levels[0]).toEqual(expect.arrayContaining([a, b]));
  });

  it('external deps (not in workspace set) are ignored', () => {
    const a = makeWorkspace('a', ['lodash', 'external-pkg']);
    const levels = topoSort([a]);
    expect(levels).toEqual([[a]]);
  });

  it('cycle fallback: all workspaces are still returned', () => {
    const a = makeWorkspace('a', ['b']);
    const b = makeWorkspace('b', ['a']);
    const levels = topoSort([a, b]);
    const allWorkspaces = levels.flat();
    expect(allWorkspaces).toHaveLength(2);
    expect(allWorkspaces).toEqual(expect.arrayContaining([a, b]));
  });
});
