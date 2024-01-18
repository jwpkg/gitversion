export function tagPrefix(globalTagPrefix: string, packageName?: string) {
  if (packageName) {
    return `${globalTagPrefix}${packageName}@`;
  }
  return globalTagPrefix;
}
