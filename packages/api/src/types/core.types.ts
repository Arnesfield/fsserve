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

export interface FsStreamObject {
  file: FsFile;
  stream(): NodeJS.ReadableStream;
}

export interface FsFileCollection extends Omit<FsFile, 'size' | 'stats'> {
  size: number | null;
}

export interface StatsMap {
  [Path: string]: Stats;
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
