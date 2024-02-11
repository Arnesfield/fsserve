export interface Stats {
  /** Date time string. */
  mtime: string;
}

export interface FsFile {
  name: string;
  path: string;
  kind: 'file';
  type: string;
  size: number;
  /** Human readable size. */
  hSize: string;
  stats: Stats;
}

export interface FsDirectory {
  name: string;
  path: string;
  kind: 'directory';
  type: null;
  size: number | null;
  /** Human readable size. */
  hSize: string | null;
  stats: Stats;
}

export type FsObject = FsFile | FsDirectory;
