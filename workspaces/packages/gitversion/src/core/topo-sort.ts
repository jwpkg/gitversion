import { IWorkspace } from './workspace-utils';

export function topoSort(workspaces: IWorkspace[]): IWorkspace[][] {
  const nameToWs = new Map(workspaces.map(w => [w.packageName, w]));
  const inDegree = new Map(workspaces.map(w => [w.packageName, 0]));
  const dependents = new Map<string, string[]>(workspaces.map(w => [w.packageName, []]));

  for (const w of workspaces) {
    for (const dep of w.workspaceDependencies) {
      if (nameToWs.has(dep)) {
        dependents.get(dep)!.push(w.packageName);
        inDegree.set(w.packageName, inDegree.get(w.packageName)! + 1);
      }
    }
  }

  const levels: IWorkspace[][] = [];
  let current = workspaces.filter(w => inDegree.get(w.packageName) === 0);
  const processed = new Set<string>();

  while (current.length > 0) {
    levels.push(current);
    const next: IWorkspace[] = [];
    for (const w of current) {
      processed.add(w.packageName);
      for (const dependent of dependents.get(w.packageName) ?? []) {
        const d = inDegree.get(dependent)! - 1;
        inDegree.set(dependent, d);
        if (d === 0) next.push(nameToWs.get(dependent)!);
      }
    }
    current = next;
  }

  // Cycle fallback: append any unresolved workspaces as a final level
  const unprocessed = workspaces.filter(w => !processed.has(w.packageName));
  if (unprocessed.length > 0) levels.push(unprocessed);

  return levels;
}
