import fastifyStatic from '@fastify/static';
import { FastifyPluginCallback } from 'fastify';
import path from 'path';
import { fileURLToPath } from 'url';
import { FsError } from '../core/error';
import { ServeOptions } from '../types/serve.types';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
  fastify.register(fastifyStatic, {
    root: path.join(__dirname, options.buildPath)
  });
  fastify.setNotFoundHandler((request, reply) => {
    if (request.url.startsWith(options.apiPath)) {
      throw new FsError(404, `Cannot ${request.method} ${request.url}`);
    } else {
      reply.sendFile('index.html');
    }
  });
  done();
};
