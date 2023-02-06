import { FastifyPluginCallback } from 'fastify';
import { FsServe } from '../core/fsserve';
import { ServeOptions } from './serve.types';

// NOTE: internal

export interface FsServePluginOptions {
  ctx: { addresses: string[]; fsserve: FsServe; options: ServeOptions };
}

export type FsServePluginCallback = FastifyPluginCallback<FsServePluginOptions>;
