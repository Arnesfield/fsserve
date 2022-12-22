import { Stats } from 'fs';
import { lookup } from 'mime-types';
import { basename } from 'path';
import { FsDirectory, FsFile, FsObject } from '../types/core.types';

export function createFsObject<
  T extends FsFile | FsDirectory = FsFile | FsDirectory
>(filePath: string, stats: Stats): FsObject<T> {
  const isFile = stats.isFile();
  return {
    file: <T>{
      name: basename(filePath),
      path: filePath,
      kind: isFile ? 'file' : 'directory',
      type: isFile ? lookup(filePath) || 'application/octet-stream' : null,
      // can't trust 4096 folder size
      size: isFile ? stats.size : null
    },
    stats: { [filePath]: stats }
  };
}
