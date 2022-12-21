import archiver from 'archiver';
import { Stats } from 'fs';
import { PassThrough } from 'stream';

export interface ZipItem {
  absolute: string;
  relative: string;
  stats: Stats;
}

export function zip(items: ZipItem[]): NodeJS.ReadableStream {
  const archive = archiver('zip', { zlib: { level: 9 } });
  for (const item of items) {
    const { stats, absolute, relative } = item;
    if (stats.isFile()) {
      archive.file(absolute, { name: relative, stats });
    } else if (stats.isDirectory()) {
      archive.directory(absolute, relative, { stats });
    } else if (stats.isSymbolicLink()) {
      archive.symlink(absolute, relative, stats.mode);
    }
  }
  const passThrough = new PassThrough();
  archive.pipe(passThrough);
  archive.finalize();
  return passThrough;
}
