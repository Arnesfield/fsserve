import path from 'path';

/**
 * filter out paths that are already included in another path.
 * e.g. Filter out file paths when the entire directory path is already included.
 * @param paths Absolute paths to simplify.
 * @returns The simplified paths.
 */
export function simplifyPaths(paths: string[]): string[] {
  const allPaths = Array.from(paths);
  if (paths.length <= 1) {
    return allPaths;
  }
  // sort: intentionally mutate array
  allPaths.sort();
  let previous = allPaths[0];
  const simplifiedPaths = [previous];
  for (const value of allPaths.slice(1)) {
    if (!path.dirname(value).startsWith(previous)) {
      previous = value;
      simplifiedPaths.push(value);
    }
  }
  return simplifiedPaths;
}
