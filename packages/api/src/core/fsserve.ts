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
import { createDate } from '../utils/date';
import { filesIn } from '../utils/files-in';
import * as fsw from '../utils/fsw';
import { simplifyPaths } from '../utils/simplify-paths';
import { zip, ZipItem } from '../utils/zip';
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
    const dirPath = fsw.absolute(this.rootDir, path || '');
    await fsw.statCheck('directory', dirPath);
    const names = await fs.promises.readdir(dirPath);
    const promises = names.map(async name => {
      const filePath = fsw.resolve(this.rootDir, dirPath, name);
      const stats = await fsw.stat(filePath.absolute);
      const object = createFsObject(filePath.relative, stats);
      if (stats.isDirectory()) {
        object.size = (await filesIn([filePath.absolute])).size;
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
    // simplify and get absolute target paths
    const allPaths = simplifyPaths(
      paths.map(value => fsw.absolute(this.rootDir, value))
    );
    const targets = await Promise.all(
      allPaths.map(async absolute => {
        return { absolute, stats: await fsw.stat(absolute) };
      })
    );
    // check for single path and stream file directly
    const single = allPaths.length === 1;
    const virtual = !single;
    const filePath = single
      ? path.relative(this.rootDir, targets[0].absolute)
      : '';
    const stats = targets[0].stats;
    if (single && stats.isFile()) {
      return {
        virtual,
        paths: [filePath],
        file: createFsObject<FsFile>(filePath, stats),
        stream: () => fs.createReadStream(filePath)
      };
    }
    // zip contents for directory / multiple paths
    const basePath = single
      ? filePath
      : path.relative(this.rootDir, commonPathPrefix(allPaths)) || '.';
    const name = single ? path.basename(filePath) : 'download-' + createDate();
    // prepare items to zip
    const relativePaths: string[] = [];
    const zipItems = targets.map((target): ZipItem => {
      const relative = path.relative(basePath, target.absolute);
      relativePaths.push(relative);
      return { ...target, relative };
    });
    return {
      virtual,
      paths: relativePaths,
      file: {
        name: name + '.zip',
        path: basePath,
        kind: 'file',
        type: 'application/zip',
        size: null
      },
      stream: () => zip(zipItems)
    };
  }
}
