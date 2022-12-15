import { Stats } from 'fs';
import fs from 'fs/promises';
import createError from 'http-errors';
import path from 'path';

export interface SafeFs {
  resolve(...paths: string[]): string;
  relative(...paths: string[]): string;
  stat(value: string): Promise<Stats>;
  statDir(value: string): Promise<Stats>;
}

export function createSafeFs(rootDir: string): SafeFs {
  return {
    resolve(...paths: string[]) {
      const resolvedPath = path.resolve(...paths);
      if (!resolvedPath.startsWith(rootDir)) {
        throw createError(
          403,
          'Cannot access beyond current working directory.'
        );
      }
      return resolvedPath;
    },
    relative(...paths: string[]) {
      return path.relative(rootDir, this.resolve(...paths));
    },
    async stat(value: string) {
      try {
        return await fs.stat(value);
      } catch (error: unknown) {
        const isNotFound =
          error instanceof Error &&
          (error as NodeJS.ErrnoException).code === 'ENOENT';
        throw isNotFound
          ? createError(404, 'File or directory not found.')
          : createError(500);
      }
    },
    async statDir(value: string) {
      const dirStat = await this.stat(value);
      if (!dirStat.isDirectory()) {
        throw createError(400, 'Not a directory.');
      }
      return dirStat;
    }
  };
}
