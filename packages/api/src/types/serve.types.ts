import { FsServeOptions } from './core.types';

export interface ServeOptions extends FsServeOptions {
  port?: number;
  ssl?: { cert?: string; key?: string };
  operations?: {
    download?: boolean;
    remove?: boolean;
    upload?: boolean;
    modify?: boolean;
  };
}
