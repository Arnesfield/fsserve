import { FastifyPluginCallback } from 'fastify';
import { Validator } from '../utils/validator';
import { FsServe } from './fsserve.types';

// NOTE: internal

export interface FsServePluginOptions {
  ctx: { fsserve: FsServe; validator: Validator };
}

export type FsServePluginCallback = FastifyPluginCallback<FsServePluginOptions>;
