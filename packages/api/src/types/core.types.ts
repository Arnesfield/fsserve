import { Stats } from 'fs';

export interface FsFile {
  name: string;
  path: string;
  kind: 'file';
  type: string;
  size: number;
  stats: Stats;
}

export interface FsDirectory {
  name: string;
  path: string;
  kind: 'directory';
  type: null;
  size: number | null;
  stats: Stats;
}

export type FsObject = FsFile | FsDirectory;

export interface StatsMap {
  [Path: string]: Stats;
}

export interface FsFileCollection extends Omit<FsFile, 'size' | 'stats'> {
  size: null;
  stats: StatsMap;
}

export interface FsStreamObject {
  file: FsFile;
  virtual: false;
}

export interface FsStreamArchive {
  file: FsFileCollection;
  virtual: true;
  stream(): NodeJS.ReadableStream;
}

export type FsStreamCollection = FsStreamObject | FsStreamArchive;

export interface FsServeOptions {
  rootDir?: string;
}
