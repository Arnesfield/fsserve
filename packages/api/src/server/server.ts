import Fastify, { FastifyInstance } from 'fastify';
import { cors } from '../plugins/cors';
import { apiRoute } from '../routes/api.route';
import { webRoute } from '../routes/web.route';
import { ServeOptions } from '../types/serve.types';
import { getHttpsOptions } from './options';

export async function createServer(
  options: ServeOptions,
  addresses: string[]
): Promise<FastifyInstance> {
  const apiPath = '/api';
  const fastify = Fastify({ https: await getHttpsOptions(options) });
  fastify.register(cors, { addresses });
  fastify.register(apiRoute, { prefix: apiPath, options });
  fastify.register(webRoute, { options, apiPath, buildPath: '../dist' });
  return fastify;
}
