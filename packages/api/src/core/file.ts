import { Stats } from 'fs';
import { lookup } from 'mime-types';
import { basename } from 'path';
import { FsObject } from '../types/core.types';

export function createFsObject<T extends FsObject = FsObject>(
  filePath: string,
  stats: Stats
): T {
  const isFile = stats.isFile();
  return <T>{
    name: basename(filePath),
    path: filePath,
    kind: isFile ? 'file' : 'directory',
    type: isFile ? lookup(filePath) || 'application/octet-stream' : null,
    // can't trust 4096 folder size
    size: isFile ? stats.size : null
  };
}
