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
  basePath: string;
  virtual: boolean;
  stream(): NodeJS.ReadableStream;
}

export interface FsServe {
  // TODO: rename to browse()
  get(path?: string): Promise<FsObject[]>;
  file(path: string): Promise<FsStreamObject>;
  files(paths: string[]): Promise<FsStreamCollection>;
}

export interface FsServeOptions {
  rootDir?: string;
  // TODO: move to ServeOptions
  operations?: {
    download?: boolean;
    remove?: boolean;
    upload?: boolean;
    modify?: boolean;
  };
}
