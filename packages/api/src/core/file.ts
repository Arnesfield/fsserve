import { Stats } from 'fs';
import getFolderSize from 'get-folder-size';
import { lookup } from 'mime-types';
import { basename } from 'path';
import { FsObject } from '../types/core.types';

export async function createFsObject<T extends FsObject = FsObject>(
  filePath: string,
  stats: Stats
): Promise<T> {
  const isFile = stats.isFile();
  return <T>{
    name: basename(filePath),
    path: filePath,
    kind: isFile ? 'file' : 'directory',
    type: isFile ? lookup(filePath) || 'application/octet-stream' : null,
    size: isFile ? stats.size : await getFolderSize.loose(filePath),
    stats
  };
}
