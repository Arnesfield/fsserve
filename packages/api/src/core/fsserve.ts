import commonPathPrefix from 'common-path-prefix';
import fs from 'fs';
import createHttpError from 'http-errors';
import path from 'path';
import {
  FsDirectory,
  FsFile,
  FsServe,
  FsServeOptions
} from '../types/fsserve.types';
import { zip } from '../utils/zip';
import { createFsObject } from './file';
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
        const object = createFsObject(filePath, stats);
        if (stats.isDirectory()) {
          const found = await safeFs.getFilePaths(filePath);
          object.size = found.size;
        }
        return object;
      });
      return Promise.all(promises);
    },

    async file(pathValue) {
      const filePath = safeFs.relative(pathValue);
      const stats = await safeFs.statCheck('file', filePath);
      return {
        file: createFsObject<FsFile>(filePath, stats),
        stream: () => fs.createReadStream(filePath)
      };
    },

    async files(paths) {
      if (paths.length === 0) {
        throw createHttpError(422, 'No file paths were provided.');
      }
      const single = paths.length === 1;
      const filePath = single ? safeFs.relative(paths[0]) : '';
      const stats = single ? await safeFs.stat(filePath) : undefined;
      const virtual = !stats;
      if (stats && stats.isFile()) {
        return {
          virtual,
          basePath: filePath,
          paths: [filePath],
          file: createFsObject<FsFile>(filePath, stats),
          stream: () => fs.createReadStream(filePath)
        };
      }

      const found = await safeFs.getFilePaths(...paths);
      const basePath = stats
        ? filePath
        : safeFs.relative(commonPathPrefix(found.paths)) || '.';
      const zipOpts = stats
        ? createFsObject<FsDirectory>(filePath, stats)
        : {
            size: null,
            path: basePath,
            name: 'download ' + new Date().toLocaleString().replaceAll('/', '-')
          };
      return {
        virtual,
        basePath,
        paths: found.paths.map(pathValue => path.relative(basePath, pathValue)),
        file: {
          name: zipOpts.name + '.zip',
          path: zipOpts.path,
          kind: 'file',
          type: 'application/zip',
          size: zipOpts.size
        },
        stream: () => zip(basePath, found.paths)
      };
    }
  };
}
