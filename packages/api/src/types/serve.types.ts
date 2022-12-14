import { FsServeOptions } from './fsserve.types';

export interface ServeOptions extends FsServeOptions {
  port?: number;
  ssl?: { cert?: string; key?: string };
}
