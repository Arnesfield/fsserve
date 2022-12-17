import { Stats } from 'fs';
import { lookup } from 'mime-types';
import { basename } from 'path';
import { FileItem } from '../types/fsserve.types';

export function createFileItem(filePath: string, stats: Stats): FileItem {
  return {
    name: basename(filePath),
    path: filePath,
    type: lookup(filePath) || 'application/octet-stream',
    size: stats.size,
    kind: stats.isFile() ? 'file' : 'directory'
  };
}
