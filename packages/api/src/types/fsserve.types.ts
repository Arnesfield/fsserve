export interface FileItem {
  name: string;
  path: string;
  kind: 'file' | 'directory';
  size: number;
  type: string;
}

export interface FileStreamItem {
  file: FileItem;
  stream: NodeJS.ReadableStream;
}

export interface FsServe {
  get(path?: string): Promise<FileItem[]>;
  file(path: string): Promise<FileStreamItem>;
  files(paths: string[]): Promise<FileStreamItem>;
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
