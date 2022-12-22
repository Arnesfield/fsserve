import { Stats } from 'fs';

export interface FsFile {
  name: string;
  path: string;
  kind: 'file';
  type: string;
  size: number;
}

export interface FsDirectory {
  name: string;
  path: string;
  kind: 'directory';
  type: null;
  size: number | null;
}

export interface StatsMap {
  [Path: string]: Stats;
}

export interface FsObject<
  File extends FsFile | FsDirectory = FsFile | FsDirectory
> {
  file: File;
  stats: StatsMap;
}

export interface FsStreamObject {
  file: FsFile;
  stats: StatsMap;
  stream(): NodeJS.ReadableStream;
}

export interface FsFileCollection extends Omit<FsFile, 'size'> {
  size: number | null;
}

export interface FsStreamCollection {
  file: FsFileCollection;
  stats: StatsMap;
  virtual: boolean;
  stream(): NodeJS.ReadableStream;
}

export interface FsServeOptions {
  rootDir?: string;
}
