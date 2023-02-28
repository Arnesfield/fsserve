import fastifyCookie from '@fastify/cookie';
import fastifyCsrfProtection from '@fastify/csrf-protection';
import fastifyJwt from '@fastify/jwt';
import { randomBytes as randomBytesFn } from 'crypto';
import Fastify, { FastifyInstance } from 'fastify';
import { promisify } from 'util';
import { COOKIE_AUTH_TOKEN, COOKIE_CSRF_TOKEN } from '../constants';
import { cors } from '../plugins/cors';
import { requestUtils } from '../plugins/request-utils';
import { apiRoute } from '../routes/api.route';
import { webRoute } from '../routes/web.route';
import { ServeOptions } from '../types/serve.types';
import { getHttpsOptions } from './options';

const randomBytes = promisify(randomBytesFn);

export async function createServer(
  options: ServeOptions,
  addresses: string[]
): Promise<FastifyInstance> {
  const apiPath = '/api';
  const fastify = Fastify({ https: await getHttpsOptions(options) });
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
  fastify.register(cors, { addresses });
  fastify.register(requestUtils);
  fastify.register(apiRoute, { prefix: apiPath, options });
  fastify.register(webRoute, { options, apiPath, buildPath: '../dist' });
  return fastify;
}
