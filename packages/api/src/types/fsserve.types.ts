export interface FsServe {
  get(path?: string): Promise<any>;
}

export interface FsServeOptions {
  rootDir?: string;
}
