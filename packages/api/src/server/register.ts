import { routes } from '../routes/routes';
import { FsServePluginCallback } from '../types/plugin.types';

export const register: FsServePluginCallback = (fastify, options) => {
  // TODO: serve web build
  fastify.register(routes, { prefix: 'api', ctx: options.ctx });
  return fastify;
};
