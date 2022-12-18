import { Stats } from 'fs';
import fs from 'fs/promises';
import path from 'path';
import { FsObject } from '../types/fsserve.types';
import { FsError } from './error';

export interface FilePathsInfo {
  size: number;
  paths: string[];
  stats: Record<string, Stats>;
}

export interface SafeFs {
  resolve(...paths: string[]): string;
  relative(...paths: string[]): string;
  stat(value: string): Promise<Stats>;
  statCheck(kind: FsObject['kind'], value: string): Promise<Stats>;
  getFilePaths(...dirs: string[]): Promise<FilePathsInfo>;
}

// TODO: convert to class
export function createSafeFs(rootDir: string): SafeFs {
  return {
    resolve(...paths) {
      const resolvedPath = path.resolve(...paths);
      if (!resolvedPath.startsWith(rootDir)) {
        throw new FsError(
          403,
          'Cannot access beyond current working directory.'
        );
      }
      return resolvedPath;
    },
    relative(...paths) {
      return path.relative(rootDir, this.resolve(...paths));
    },
    async stat(value) {
      try {
        return await fs.stat(value);
      } catch (error: unknown) {
        const isNotFound =
          error instanceof Error &&
          (error as NodeJS.ErrnoException).code === 'ENOENT';
        throw isNotFound
          ? new FsError(404, 'File or directory not found.')
          : new FsError(500, 'Internal Server Error');
      }
    },
    async statCheck(kind, value) {
      const dirStat = await this.stat(value);
      if ((kind === 'file') === dirStat.isDirectory()) {
        throw new FsError(400, `Not a ${kind}.`);
      }
      return dirStat;
    },

    // NOTE: taken from https://github.com/Stuk/jszip/issues/386#issuecomment-1283099454

    // TODO: move to separate file
    async getFilePaths(...dirs) {
      const info: FilePathsInfo = { size: 0, paths: [], stats: {} };
      const recursive = (dirs: string[]): Promise<void[]> => {
        const promises = dirs.map(async dir => {
          const stats = await this.stat(dir);
          if (stats.isFile()) {
            info.paths.push(dir);
            info.size += stats.size;
            info.stats[dir] = stats;
            return;
          }
          const files = await fs.readdir(dir);
          const filePaths: string[] = [];
          for (const file of files) {
            const filePath = this.resolve(dir, file);
            // add if not yet included
            if (!info.stats[filePath]) {
              filePaths.push(filePath);
            }
          }
          await recursive(filePaths);
        });
        return Promise.all(promises);
      };
      await recursive(dirs.map(dir => this.resolve(dir)));
      return info;
    }
  };
}
