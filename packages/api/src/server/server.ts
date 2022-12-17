import Fastify, { FastifyInstance } from 'fastify';
import { fsserve } from '../core/fsserve';
import { ServeOptions } from '../types/serve.types';
import { Validator } from '../utils/validator';
import { getHttpsOptions } from './options';
import { register } from './register';

export async function createServer(
  options: ServeOptions
): Promise<FastifyInstance> {
  const fastify = Fastify({ https: await getHttpsOptions(options) });
  fastify.register(register, {
    ctx: { fsserve: fsserve(options), validator: new Validator(options) }
  });
  return fastify;
}
