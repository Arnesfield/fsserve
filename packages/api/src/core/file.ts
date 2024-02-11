import { Stats } from 'fs';
import getFolderSize from 'get-folder-size';
import { lookup } from 'mime-types';
import { basename } from 'path';
import prettyBytes from 'pretty-bytes';
import { FsObject } from '../types/core.types';

export async function createFsObject<T extends FsObject = FsObject>(
  filePath: string,
  stats: Stats
): Promise<T> {
  const isFile = stats.isFile();
  const size = isFile ? stats.size : await getFolderSize.loose(filePath);
  return <T>{
    name: basename(filePath),
    path: filePath,
    kind: isFile ? 'file' : 'directory',
    type: isFile ? lookup(filePath) || 'application/octet-stream' : null,
    size: size,
    hSize: prettyBytes(size),
    stats
  };
}
