import fastifyMultipart from '@fastify/multipart';
import { FastifyPluginCallback } from 'fastify';
import {
  description,
  homepage,
  license,
  name,
  version
} from '../../../../package.json';
import { MAX_FILE_SIZE } from '../constants';
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
  const fileSize = options.size ?? MAX_FILE_SIZE;
  fastify.register(fastifyMultipart, { limits: { files: 1, fileSize } });
  fastify.get('/', () => {
    return {
      name,
      version,
      description,
      homepage,
      license,
      operations: options.operations || {}
    };
  });
  fastify.register(fileRoute, { prefix: '/files', options, fsserve: fss });
  done();
};
