import fastifyMultipart from '@fastify/multipart';
import { FastifyPluginCallback } from 'fastify';
import {
  description,
  homepage,
  license,
  name,
  version
} from '../../../../package.json';
import { fsserve } from '../core/fsserve';
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
  fastify.register(fastifyMultipart);
  fastify.get('/', () => ({ name, version, description, homepage, license }));
  fastify.register(fileRoute, { prefix: '/files', options, fsserve: fss });
  done();
};
