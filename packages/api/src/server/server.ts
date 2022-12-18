import Fastify, { FastifyInstance } from 'fastify';
import { fsserve } from '../core/fsserve';
import { register } from '../routes/register';
import { ServeOptions } from '../types/serve.types';
import { getHttpsOptions } from './options';

export async function createServer(
  options: ServeOptions
): Promise<FastifyInstance> {
  const fastify = Fastify({ https: await getHttpsOptions(options) });
  fastify.register(register, { ctx: { options, fsserve: fsserve(options) } });
  return fastify;
}
