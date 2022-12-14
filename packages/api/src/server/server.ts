import Fastify, { FastifyInstance } from 'fastify';
import { fsserve } from '../core/fsserve';
import { ServeOptions } from '../types/serve.types';
import { getHttpsOptions } from './options';
import { register } from './register';

export async function createServer(
  options: ServeOptions
): Promise<FastifyInstance> {
  const fastify = Fastify({ https: await getHttpsOptions(options) });
  fastify.register(register, { fsserve: fsserve(options) });
  return fastify;
}
