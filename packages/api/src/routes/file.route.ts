import { FsServePluginCallback } from '../types/plugin.types';

export const fileRoute: FsServePluginCallback = (fastify, options) => {
  const { fsserve } = options;
  fastify.get(
    '/',
    {
      schema: {
        querystring: {
          type: 'object',
          properties: { path: { type: 'string' } }
        }
      }
    },
    request => {
      // TODO: update types
      const query = request.query as any;
      const path = query.path as string | undefined;
      return fsserve.get(path);
    }
  );
  return fastify;
};
