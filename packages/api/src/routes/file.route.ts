import type { JSONSchemaType } from 'ajv';
import { FastifySchema } from 'fastify';
import { Operation } from '../types/operation.types';
import { FsServePluginCallback } from '../types/plugin.types';

interface GetRootSchema extends FastifySchema {
  Querystring: { path?: string };
}
interface GetViewSchema extends FastifySchema {
  Querystring: { path: string };
}
interface GetDownloadSchema extends FastifySchema {
  Querystring: { paths: string[] };
}

export const fileRoute: FsServePluginCallback = (fastify, options) => {
  const { fsserve, validator } = options.ctx;

  fastify.get<GetRootSchema>('/', {
    schema: {
      querystring: <JSONSchemaType<GetRootSchema['Querystring']>>{
        type: 'object',
        properties: { path: { type: 'string' } }
      }
    },
    handler(request) {
      return fsserve.get(request.query.path);
    }
  });

  fastify.get<GetViewSchema>('/view', {
    schema: {
      querystring: <JSONSchemaType<GetViewSchema['Querystring']>>{
        type: 'object',
        required: ['path'],
        properties: { path: { type: 'string' } }
      }
    },
    async preHandler() {
      validator.guard(Operation.Download);
    },
    async handler(request, reply) {
      const { file, stream } = await fsserve.file(request.query.path);
      const filename = JSON.stringify(file.name);
      return reply
        .type(file.type)
        .header('Content-Length', file.size)
        .header('Content-Disposition', `filename=${filename}`)
        .send(stream);
    }
  });

  fastify.get<GetDownloadSchema>('/download', {
    schema: {
      querystring: <JSONSchemaType<GetDownloadSchema['Querystring']>>{
        type: 'object',
        required: ['paths'],
        properties: {
          paths: { type: 'array', minItems: 1, items: { type: 'string' } }
        }
      }
    },
    async preHandler() {
      validator.guard(Operation.Download);
    },
    async handler(request, reply) {
      const { file, stream } = await fsserve.files(request.query.paths);
      const filename = JSON.stringify(file.name);
      return reply
        .type(file.type)
        .header('Content-Length', file.size)
        .header('Content-Disposition', `attachment; filename=${filename}`)
        .send(stream);
    }
  });
  return fastify;
};
