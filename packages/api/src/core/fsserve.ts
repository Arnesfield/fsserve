import commonPathPrefix from 'common-path-prefix';
import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';
import {
  FsFile,
  FsObject,
  FsServeOptions,
  FsServeUploadOptions,
  FsStreamCollection,
  StatsMap,
  UploadAction
} from '../types/core.types';
import { createDate } from '../utils/date';
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
      return createFsObject(filePath.relative, stats);
    });
    return Promise.all(promises);
  }

  async file(path: string): Promise<FsFile> {
    const filePath = fsw.resolve(this.rootDir, path);
    const stats = await fsw.statCheck('file', filePath.absolute);
    return createFsObject(filePath.relative, stats);
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
    const filePath = single
      ? path.relative(this.rootDir, targets[0].absolute)
      : '';
    const stats = targets[0].stats;
    if (single && stats.isFile()) {
      return { file: await createFsObject(filePath, stats), virtual: false };
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
        size: null,
        stats: statsMap
      },
      virtual: true,
      stream: () => zip(zipItems)
    };
  }

  private async preupload(
    file: { name: string; size: number },
    action: UploadAction | undefined,
    path?: string
  ) {
    const target = fsw.absolute(
      this.rootDir,
      typeof path === 'string' ? path : '',
      file.name
    );
    let existingFile: FsFile;
    try {
      existingFile = await createFsObject<FsFile>(
        target,
        await fsw.stat(target)
      );
    } catch (error: unknown) {
      // skip error if file is not found
      if (error instanceof FsError && error.statusCode === 404) {
        return { target };
      }
      throw error;
    }

    let error:
      | {
          message: string;
          metadata: { file?: FsFile; actions: UploadAction[] };
        }
      | undefined;
    if (!existingFile.stats.isFile()) {
      error = {
        message: 'File name already exists.',
        metadata: { actions: [UploadAction.Rename] }
      };
    } else if (existingFile.size < file.size) {
      // if file is (probably) not fully uploaded, allow resume upload
      error = {
        message: 'Partial file already exists.',
        metadata: { file: existingFile, actions: Object.values(UploadAction) }
      };
    } else {
      error = {
        message: 'File already exists.',
        metadata: {
          file: existingFile,
          actions: [UploadAction.Rename, UploadAction.Replace]
        }
      };
    }
    if (error && (!action || !error.metadata.actions.includes(action))) {
      throw new FsError(409, error.message, error.metadata);
    }
    return { target, file: existingFile, action };
  }

  async upload(
    options: FsServeUploadOptions
  ): Promise<{ path: string; created: boolean }> {
    const data = await this.preupload(
      options.file,
      options.action,
      options.path
    );
    let writePath = data.target;
    const streamOptions: { flags?: string } = {};
    if (data.file) {
      switch (data.action) {
        case UploadAction.Resume:
          streamOptions.flags = 'a';
          break;
        case UploadAction.Rename:
          writePath = await fsw.getWritePath(data.target);
          break;
        case UploadAction.Replace:
          break;
      }
    }
    // TODO: handle file locking?
    try {
      await pipeline(
        options.stream,
        fs.createWriteStream(writePath, streamOptions)
      );
      const created = !data.file || data.action !== UploadAction.Resume;
      return { path: writePath, created };
    } catch {
      throw new FsError(500, 'Unable to upload file.');
    }
  }
}
