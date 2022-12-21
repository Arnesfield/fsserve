import fs from 'fs';
import path from 'path';
import * as fsw from './fsw';

export interface FilesResult {
  size: number;
  paths: string[];
  data: Record<string, { path: string; stats: fs.Stats }>;
}

export async function filesIn(dirs: string[]): Promise<FilesResult> {
  const result: FilesResult = { size: 0, paths: [], data: {} };
  function recursive(dirs: string[]): Promise<void[]> {
    const promises = dirs.map(async dir => {
      const stats = await fsw.stat(dir);
      if (stats.isFile()) {
        result.paths.push(dir);
        result.size += stats.size;
        result.data[dir] = { path: dir, stats };
        return;
      }
      const files = await fs.promises.readdir(dir);
      const filePaths: string[] = [];
      for (const file of files) {
        const filePath = path.resolve(dir, file);
        // add if not yet included
        if (!result.data[filePath]) {
          filePaths.push(filePath);
        }
      }
      await recursive(filePaths);
    });
    return Promise.all(promises);
  }
  await recursive(dirs);
  return result;
}
