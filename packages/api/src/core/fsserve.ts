import commonPathPrefix from 'common-path-prefix';
import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream';
import util from 'util';
import {
  FsFile,
  FsObject,
  FsServeOptions,
  FsStreamCollection,
  FsStreamObject,
  StatsMap
} from '../types/core.types';
import { createDate } from '../utils/date';
import * as fsw from '../utils/fsw';
import { simplifyPaths } from '../utils/simplify-paths';
import { zip, ZipItem } from '../utils/zip';
import { FsError } from './error';
import { createFsObject } from './file';

const pump = util.promisify(pipeline);

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
      return createFsObject(filePath.relative, stats);
    });
    return Promise.all(promises);
  }

  async file(path: string): Promise<FsStreamObject> {
    const filePath = fsw.resolve(this.rootDir, path);
    const stats = await fsw.statCheck('file', filePath.absolute);
    return {
      file: await createFsObject(filePath.relative, stats),
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
      const file = await createFsObject<FsFile>(filePath, stats);
      delete (file as Partial<FsFile>).stats;
      return {
        file,
        stats: { [filePath]: stats },
        virtual,
        stream: () => fs.createReadStream(filePath)
      };
    }
    // zip contents for directory / multiple paths
    const basePath = single
      ? filePath
      : path.relative(this.rootDir, commonPathPrefix(allPaths)) || '.';
    const name = single ? path.basename(filePath) : 'download-' + createDate();
    // prepare items to zip
    const statsMap: StatsMap = {};
    const zipItems = targets.map((target): ZipItem => {
      statsMap[path.relative(this.rootDir, target.absolute)] = target.stats;
      return { ...target, relative: path.relative(basePath, target.absolute) };
    });
    return {
      file: {
        name: name + '.zip',
        path: basePath,
        kind: 'file',
        type: 'application/zip',
        size: null
      },
      stats: statsMap,
      virtual,
      stream: () => zip(zipItems)
    };
  }

  async upload(
    stream: NodeJS.ReadableStream,
    fileName: string,
    path?: string
  ): Promise<string> {
    const target = fsw.absolute(
      this.rootDir,
      typeof path === 'string' ? path : '',
      fileName
    );
    const filePath = await fsw.getWritePath(target);
    try {
      await pump(stream, fs.createWriteStream(filePath));
      return filePath;
    } catch {
      // no await so it deletes asynchronously
      fsw.unlink(filePath);
      throw new FsError(500, 'Unable to upload file.');
    }
  }
}
