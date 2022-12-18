import {
  description,
  homepage,
  license,
  name,
  version
} from '../../../../package.json';
import { FsServePluginCallback } from '../types/plugin.types';
import { fileRoute } from './file.route';

// prefix: /api
export const routes: FsServePluginCallback = (fastify, options) => {
  fastify.get('/', () => ({ name, version, description, homepage, license }));
  fastify.register(fileRoute, { prefix: 'files', ctx: options.ctx });
  return fastify;
};
