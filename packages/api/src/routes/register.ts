import fastifyStatic from '@fastify/static';
import fastifyView from '@fastify/view';
import ejs from 'ejs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  description,
  homepage,
  license,
  name,
  version
} from '../../../../package.json';
import { FsError } from '../core/error';
import { FsServePluginCallback } from '../types/plugin.types';
import { fileRoutes } from './file.routes';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface ApiData {
  sameOrigin: string;
}

// entry point for server routes

export const register: FsServePluginCallback = (fastify, options) => {
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
      reply.header('Access-Control-Allow-Methods', 'GET, POST');
    }
    done();
  });
  // serve web build
  const API_PATH = '/api';
  const root = path.join(__dirname, '../dist');
  const data = { api: { sameOrigin: 'true' } satisfies ApiData };
  fastify.register(fastifyStatic, { root });
  fastify.register(fastifyView, { root, engine: { ejs } });
  fastify.get('/', (_request, reply) => {
    reply.status(200).view('index.html', data);
  });
  fastify.setNotFoundHandler((request, reply) => {
    if (request.url.startsWith(API_PATH)) {
      reply.status(404);
      reply.send(new FsError(404, `Cannot ${request.method} ${request.url}`));
    } else {
      reply.status(200).view('index.html', data);
    }
  });
  // serve api
  fastify.get(API_PATH, () => {
    return { name, version, description, homepage, license };
  });
  fastify.register(fileRoutes, {
    prefix: `${API_PATH}/files`,
    ctx: options.ctx
  });
  return fastify;
};
