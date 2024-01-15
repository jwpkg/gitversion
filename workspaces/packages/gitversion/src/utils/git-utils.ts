export function tagPrefix(globalTagPrefix: string = 'v', packageName?: string) {
  if (packageName) {
    return `${globalTagPrefix}${packageName}-`;
  }
  return globalTagPrefix;
}
