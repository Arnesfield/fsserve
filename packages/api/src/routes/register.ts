import {
  description,
  homepage,
  license,
  name,
  version
} from '../../../../package.json';
import { FsServePluginCallback } from '../types/plugin.types';
import { fileRoutes } from './file.routes';

// entry point for server routes

export const register: FsServePluginCallback = (fastify, options) => {
  // TODO: serve web build
  const url = new URL('http://localhost:8082');
  const allowedOrigins = options.ctx.addresses.map(address => {
    url.hostname = address;
    const str = url.toString();
    return str.endsWith('/') ? str.slice(0, -1) : str;
  });
  fastify.addHook('onRequest', (request, reply, done) => {
    const origin = request.headers.origin;
    if (origin && allowedOrigins.includes(origin)) {
      reply.header('Access-Control-Allow-Origin', origin);
    }
    reply.header('Access-Control-Allow-Methods', 'GET, POST');
    done();
  });
  fastify.get('/api', () => {
    return { name, version, description, homepage, license };
  });
  fastify.register(fileRoutes, { prefix: '/api/files', ctx: options.ctx });
  return fastify;
};
