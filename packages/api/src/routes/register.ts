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
  fastify.get('/api', () => {
    return { name, version, description, homepage, license };
  });
  fastify.register(fileRoutes, { prefix: '/api/files', ctx: options.ctx });
  return fastify;
};
