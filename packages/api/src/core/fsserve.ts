import fs from 'fs/promises';
import { FsServe, FsServeOptions } from '../types/fsserve.types';
import { createSafeFs } from './safeFs';

export function fsserve(options: FsServeOptions = {}): FsServe {
  const rootDir = options.rootDir || process.cwd();
  const safeFs = createSafeFs(rootDir);
  return {
    async get(pathValue) {
      const dir = safeFs.resolve(pathValue || '');
      await safeFs.statDir(dir);
      const names = await fs.readdir(dir);
      const promises = names.map(async name => {
        const filePath = safeFs.relative(dir, name);
        const stat = await safeFs.stat(filePath);
        return {
          name,
          path: filePath,
          directory: stat.isDirectory()
        };
      });
      return Promise.all(promises);
    }
  };
}
