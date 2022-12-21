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

export type FsObject = FsFile | FsDirectory;

export interface FsStreamObject {
  file: FsFile;
  stream(): NodeJS.ReadableStream;
}

export interface FsFileCollection extends Omit<FsFile, 'size'> {
  size: number | null;
}

export interface FsStreamCollection {
  file: FsFileCollection;
  paths: string[];
  virtual: boolean;
  stream(): NodeJS.ReadableStream;
}

export interface FsServeOptions {
  rootDir?: string;
}
