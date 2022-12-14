import { FastifyPluginCallback } from 'fastify';
import { FsServe } from './fsserve.types';

// NOTE: internal

export interface FsServePluginOptions {
  fsserve: FsServe;
}

export type FsServePluginCallback = FastifyPluginCallback<FsServePluginOptions>;
