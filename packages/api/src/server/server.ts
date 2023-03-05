import fastifyCookie from '@fastify/cookie';
import fastifyCsrfProtection from '@fastify/csrf-protection';
import fastifyJwt from '@fastify/jwt';
import fastifyStatic from '@fastify/static';
import { randomBytes as randomBytesFn } from 'crypto';
import Fastify, { FastifyInstance } from 'fastify';
import path from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';
import { COOKIE_AUTH_TOKEN, COOKIE_CSRF_TOKEN } from '../constants';
import { FsError } from '../core/error';
import { cors } from '../plugins/cors';
import { requestUtils } from '../plugins/request-utils';
import { apiRoute } from '../routes/api.route';
import { ServeOptions } from '../types/serve.types';
import { getHttpsOptions } from './options';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const randomBytes = promisify(randomBytesFn);

export async function createServer(
  options: ServeOptions,
  addresses: string[]
): Promise<FastifyInstance> {
  const apiPath = '/api';
  const fastify = Fastify({ https: await getHttpsOptions(options) });
  fastify.setErrorHandler((error, _, reply) => {
    if (error instanceof FsError) {
      reply.status(error.statusCode).send(error.toJSON());
    } else {
      reply.send(error);
    }
  });
  const secret = options.secret || (await randomBytes(32)).toString('base64');
  fastify.register(fastifyCookie, { secret });
  fastify.register(fastifyCsrfProtection, {
    cookieKey: COOKIE_CSRF_TOKEN,
    cookieOpts: { signed: true, httpOnly: true }
  });
  fastify.register(fastifyJwt, {
    secret,
    cookie: { cookieName: COOKIE_AUTH_TOKEN, signed: true }
  });
  // web route, also expose reply.sendFile()
  fastify.register(fastifyStatic, { root: path.join(__dirname, '../dist') });
  fastify.register(cors, { addresses });
  fastify.register(requestUtils);
  fastify.register(apiRoute, { prefix: apiPath, options });
  // web route fallback
  fastify.setNotFoundHandler((request, reply) => {
    if (request.url.startsWith(apiPath)) {
      throw new FsError(404, `Cannot ${request.method} ${request.url}`);
    } else {
      reply.sendFile('index.html');
    }
  });
  return fastify;
}
