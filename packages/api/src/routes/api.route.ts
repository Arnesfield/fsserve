import fastifyMultipart from '@fastify/multipart';
import { JSONSchemaType } from 'ajv';
import { randomUUID } from 'crypto';
import {
  FastifyInstance,
  FastifyPluginCallback,
  RouteGenericInterface
} from 'fastify';
import {
  description,
  homepage,
  license,
  name,
  version
} from '../../../../package.json';
import { COOKIE_AUTH_TOKEN, MAX_FILE_SIZE } from '../constants';
import { FsError } from '../core/error';
import { fsserve } from '../core/fsserve';
import { jwt } from '../plugins/jwt';
import { ServeOptions } from '../types/serve.types';
import { fileRoute } from './file.route';

// entry point for server routes

export interface ApiRouteOptions {
  options: ServeOptions;
}

export const apiRoute: FastifyPluginCallback<ApiRouteOptions> = (
  fastify,
  opts,
  done
) => {
  const { options } = opts;
  const fss = fsserve(options);
  const fileSize = options.size ?? MAX_FILE_SIZE;
  fastify.register(fastifyMultipart, { limits: { files: 1, fileSize } });
  fastify.register(fileRoute, { prefix: '/files', options, fsserve: fss });
  // api route
  const route = new ApiRoute(options);
  route.root(fastify);
  route.validate(fastify);
  route.auth(fastify);
  // data
  fastify.register((instance, _opts, done) => {
    instance.register(jwt, { verify: !!options.password });
    route.data(instance);
    done();
  });
  done();
};

class ApiRoute {
  constructor(protected readonly options: ServeOptions) {}

  // GET /
  root(fastify: FastifyInstance) {
    fastify.get('/', () => ({ name, version, description, homepage, license }));
  }

  // GET /data
  data(fastify: FastifyInstance) {
    fastify.get('/data', () => ({ operations: this.options.operations || {} }));
  }

  // GET /validate
  validate(fastify: FastifyInstance) {
    fastify.get('/validate', (request, reply) => {
      const csrfToken = reply.generateCsrf(request.getCookieOptions());
      return { csrfToken };
    });
  }

  // POST /auth
  auth(fastify: FastifyInstance) {
    interface Schema extends RouteGenericInterface {
      Body: { password: string };
    }
    fastify.post<Schema>('/auth', {
      schema: {
        body: <JSONSchemaType<Schema['Body']>>{
          type: 'object',
          properties: { password: { type: 'string' } }
        }
      },
      onRequest: fastify.csrfProtection,
      handler: (request, reply) => {
        if (request.body.password !== this.options.password) {
          throw new FsError(401, 'Invalid password.');
        }
        const token = fastify.jwt.sign(
          { payload: { userId: randomUUID() } },
          { expiresIn: '1d' }
        );
        return reply
          .setCookie(COOKIE_AUTH_TOKEN, token, request.getCookieOptions())
          .send({ ok: true });
      }
    });
  }
}
