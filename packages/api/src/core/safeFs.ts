import { Stats } from 'fs';
import fs from 'fs/promises';
import createHttpError from 'http-errors';
import path from 'path';
import { FileItem } from '../types/fsserve.types';

export interface SafeFs {
  resolve(...paths: string[]): string;
  relative(...paths: string[]): string;
  stat(value: string): Promise<Stats>;
  statCheck(kind: FileItem['kind'], value: string): Promise<Stats>;
  getFilePaths(dir: string): Promise<string[]>;
}

// TODO: convert to class
// TODO: use custom error
export function createSafeFs(rootDir: string): SafeFs {
  return {
    resolve(...paths) {
      const resolvedPath = path.resolve(...paths);
      if (!resolvedPath.startsWith(rootDir)) {
        throw createHttpError(
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
          ? createHttpError(404, 'File or directory not found.')
          : createHttpError(500);
      }
    },
    async statCheck(kind, value) {
      const dirStat = await this.stat(value);
      if ((kind === 'file') === dirStat.isDirectory()) {
        throw createHttpError(400, `Not a ${kind}.`);
      }
      return dirStat;
    },

    // NOTE: taken from https://github.com/Stuk/jszip/issues/386#issuecomment-1283099454

    async getFilePaths(dir: string) {
      const stats = await this.stat(dir);
      if (stats.isFile()) {
        return [dir];
      }
      const files = await fs.readdir(dir);
      const paths = await Promise.all(
        files.map(file => this.getFilePaths(this.resolve(dir, file)))
      );
      return paths.flat();
    }
  };
}
