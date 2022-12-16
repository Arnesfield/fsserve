export interface FsServe {
  get(path?: string): Promise<any>;
}

export interface FsServeOptions {
  rootDir?: string;
  operations?: {
    download?: boolean;
    remove?: boolean;
    upload?: boolean;
    modify?: boolean;
  };
}
