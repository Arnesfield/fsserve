export interface Stats {}

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
