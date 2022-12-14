import { FsServePluginCallback } from '../types/plugin.types';
import { pkg } from '../utils/pkg';
import { fileRoute } from './file.route';

// prefix: /api
export const routes: FsServePluginCallback = (fastify, options) => {
  fastify.get('/', () => pkg);
  fastify.register(fileRoute, { prefix: 'files', fsserve: options.fsserve });
  return fastify;
};
