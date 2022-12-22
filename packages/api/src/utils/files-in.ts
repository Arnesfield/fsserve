import fs from 'fs';
import path from 'path';
import { StatsMap } from '../types/core.types';
import * as fsw from './fsw';

export interface FilesResult {
  size: number;
  stats: StatsMap;
}

export async function filesIn(
  dirs: string[],
  rootDir: string
): Promise<FilesResult> {
  const result: FilesResult = { size: 0, stats: {} };
  function recursive(dirs: string[]): Promise<void[]> {
    const promises = dirs.map(async dir => {
      const stats = await fsw.stat(dir);
      if (stats.isFile()) {
        result.size += stats.size;
        result.stats[path.relative(rootDir, dir)] = stats;
        return;
      }
      const files = await fs.promises.readdir(dir);
      const filePaths: string[] = [];
      for (const file of files) {
        const filePath = fsw.resolve(rootDir, dir, file);
        // add if not yet included
        if (!result.stats[filePath.relative]) {
          filePaths.push(filePath.absolute);
        }
      }
      await recursive(filePaths);
    });
    return Promise.all(promises);
  }
  await recursive(dirs);
  return result;
}
