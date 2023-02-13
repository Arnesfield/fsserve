import fastifyStatic from '@fastify/static';
import fastifyView from '@fastify/view';
import ejs from 'ejs';
import { FastifyPluginCallback } from 'fastify';
import path from 'path';
import { fileURLToPath } from 'url';
import { FsError } from '../core/error';
import { Operation } from '../types/operation.types';
import { ServeOptions } from '../types/serve.types';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

type BooleanString = 'true' | 'false';

interface ApiData {
  api: { sameOrigin: BooleanString };
  apiOperations: { [K in Operation]: BooleanString };
}

export interface WebRouteOptions {
  apiPath: string;
  buildPath: string;
  options: ServeOptions;
}

export const webRoute: FastifyPluginCallback<WebRouteOptions> = (
  fastify,
  options,
  done
) => {
  const o = options.options.operations || {};
  const apiOperations = Object.values(Operation).reduce((all, operation) => {
    all[operation] = `${o[operation] || false}`;
    return all;
  }, {} as ApiData['apiOperations']);
  const data: ApiData = { api: { sameOrigin: 'true' }, apiOperations };
  const root = path.join(__dirname, options.buildPath);

  fastify.register(fastifyStatic, { root });
  fastify.register(fastifyView, { root, engine: { ejs } });

  fastify.get('/', (_request, reply) => {
    reply.status(200).view('index.html', data);
  });
  fastify.setNotFoundHandler((request, reply) => {
    if (request.url.startsWith(options.apiPath)) {
      throw new FsError(404, `Cannot ${request.method} ${request.url}`);
    } else {
      reply.status(200).view('index.html', data);
    }
  });
  done();
};
