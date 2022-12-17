import commonPathPrefix from 'common-path-prefix';
import fs from 'fs';
import createHttpError from 'http-errors';
import path from 'path';
import { Readable } from 'stream';
import { FsServe, FsServeOptions } from '../types/fsserve.types';
import { zip } from '../utils/zip';
import { createFileItem } from './file';
import { createSafeFs } from './safeFs';

// TODO: convert to internal class, keep fsserve() api
export function fsserve(options: FsServeOptions = {}): FsServe {
  const rootDir = options.rootDir || process.cwd();
  const safeFs = createSafeFs(rootDir);
  return {
    async get(pathValue) {
      const dir = safeFs.resolve(pathValue || '');
      await safeFs.statCheck('directory', dir);
      const names = await fs.promises.readdir(dir);
      const promises = names.map(async name => {
        const filePath = safeFs.relative(dir, name);
        const stats = await safeFs.stat(filePath);
        return createFileItem(filePath, stats);
      });
      return Promise.all(promises);
    },

    async file(pathValue) {
      const filePath = safeFs.relative(pathValue);
      const stats = await safeFs.statCheck('file', filePath);
      return {
        file: createFileItem(filePath, stats),
        stream: fs.createReadStream(filePath)
      };
    },

    async files(paths) {
      if (paths.length === 0) {
        throw createHttpError(422, 'No file paths were provided.');
      }
      let zipOpts: {
        name: string; // file.name
        path: string; // file.path
        basePath: string; // current directory
        paths: string[]; // paths to include in download
      };
      if (paths.length === 1) {
        const filePath = safeFs.relative(paths[0]);
        const stats = await safeFs.stat(filePath);
        if (stats.isFile()) {
          return {
            file: createFileItem(filePath, stats),
            stream: fs.createReadStream(filePath)
          };
        }
        zipOpts = {
          name: path.basename(filePath),
          path: path.dirname(filePath),
          basePath: filePath,
          paths: await safeFs.getFilePaths(filePath)
        };
      } else {
        const paths2d = await Promise.all(
          paths.map(path => safeFs.getFilePaths(safeFs.resolve(path)))
        );
        const allPaths = paths2d.flat();
        const commonPath = safeFs.relative(commonPathPrefix(allPaths)) || '.';
        zipOpts = {
          name: 'download',
          path: commonPath,
          basePath: commonPath,
          paths: allPaths
        };
      }
      // zip contents
      const buffer = await zip(zipOpts.basePath, zipOpts.paths);
      return {
        stream: Readable.from(buffer),
        file: {
          name: zipOpts.name + '.zip',
          path: zipOpts.path,
          type: 'application/zip',
          size: buffer.byteLength,
          kind: 'file'
        }
      };
    }
  };
}
