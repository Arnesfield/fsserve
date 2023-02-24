import fastifyStatic from '@fastify/static';
import fastifyView from '@fastify/view';
import ejs from 'ejs';
import { FastifyPluginCallback } from 'fastify';
import path from 'path';
import { fileURLToPath } from 'url';
import { FsError } from '../core/error';
import { ServeOptions } from '../types/serve.types';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

type BooleanString = 'true' | 'false';

interface ViewData {
  api: { sameOrigin: BooleanString };
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
  const data: ViewData = { api: { sameOrigin: 'true' } };
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
