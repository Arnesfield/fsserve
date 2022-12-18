import commonPathPrefix from 'common-path-prefix';
import fs from 'fs';
import path from 'path';
import {
  FsFile,
  FsObject,
  FsServeOptions,
  FsStreamCollection,
  FsStreamObject
} from '../types/core.types';
import { filesIn } from '../utils/filesIn';
import * as fsw from '../utils/fsw';
import { zip } from '../utils/zip';
import { FsError } from './error';
import { createFsObject } from './file';

export type FsServe = InstanceType<typeof FsServeClass>;

export function fsserve(options: FsServeOptions = {}): FsServe {
  return new FsServeClass(options);
}

class FsServeClass {
  private readonly rootDir: string;

  constructor(options: FsServeOptions = {}) {
    this.rootDir = options.rootDir || process.cwd();
  }

  async browse(path?: string): Promise<FsObject[]> {
    const dirPath = fsw.resolve(this.rootDir, path || '');
    await fsw.statCheck('directory', dirPath.absolute);
    const names = await fs.promises.readdir(dirPath.absolute);
    const promises = names.map(async name => {
      const filePath = fsw.resolve(this.rootDir, dirPath.absolute, name);
      const stats = await fsw.stat(filePath.absolute);
      const object = createFsObject(filePath.relative, stats);
      if (stats.isDirectory()) {
        const found = await filesIn([filePath.absolute], this.rootDir);
        object.size = found.size;
      }
      return object;
    });
    return Promise.all(promises);
  }

  async file(path: string): Promise<FsStreamObject> {
    const filePath = fsw.resolve(this.rootDir, path);
    const stats = await fsw.statCheck('file', filePath.absolute);
    return {
      file: createFsObject<FsFile>(filePath.relative, stats),
      stream: () => fs.createReadStream(filePath.absolute)
    };
  }

  async files(paths: string[]): Promise<FsStreamCollection> {
    if (paths.length === 0) {
      throw new FsError(422, 'No file paths were provided.');
    }
    const single = paths.length === 1;
    const filePath = single ? fsw.resolve(this.rootDir, paths[0]).relative : '';
    const stats = single ? await fsw.stat(filePath) : undefined;
    const virtual = !stats;
    if (stats && stats.isFile()) {
      return {
        virtual,
        paths: [filePath],
        file: createFsObject<FsFile>(filePath, stats),
        stream: () => fs.createReadStream(filePath)
      };
    }
    // zip contents for folder / multiple paths
    const foundPaths = (await filesIn(paths, this.rootDir)).paths;
    const basePath = stats
      ? filePath
      : fsw.resolve(this.rootDir, commonPathPrefix(foundPaths)).relative || '.';
    const name = stats
      ? path.basename(filePath)
      : 'download ' + new Date().toLocaleString().replaceAll('/', '-');
    return {
      virtual,
      paths: foundPaths.map(value => path.relative(basePath, value)),
      file: {
        name: name + '.zip',
        path: basePath,
        kind: 'file',
        type: 'application/zip',
        size: null
      },
      stream: () => zip(basePath, foundPaths)
    };
  }
}
