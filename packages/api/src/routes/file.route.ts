import type { JSONSchemaType } from 'ajv';
import { FastifySchema, preHandlerHookHandler } from 'fastify';
import { FsError } from '../core/error';
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

export const fileRoute: FsServePluginCallback = (fastify, opts) => {
  const { fsserve, options } = opts.ctx;

  // TODO: improve this somehow
  function guard(...operations: Operation[]) {
    const allOperations = options.operations;
    const valid =
      !allOperations || operations.every(operation => allOperations[operation]);
    if (!valid) {
      return new FsError(403, 'Not authorized to perform this action.');
    }
  }

  function preHandle(...operations: Operation[]): preHandlerHookHandler {
    return (_response, _reply, done) => done(guard(...operations));
  }

  const downloadGuard = preHandle(Operation.Download);

  // routes

  fastify.get<GetRootSchema>('/', {
    schema: {
      querystring: <JSONSchemaType<GetRootSchema['Querystring']>>{
        type: 'object',
        properties: { path: { type: 'string' } }
      }
    },
    handler(request) {
      return fsserve.browse(request.query.path);
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
    preHandler: downloadGuard,
    async handler(request, reply) {
      const { file, stream } = await fsserve.file(request.query.path);
      const filename = JSON.stringify(file.name);
      return reply
        .type(file.type)
        .header('Content-Length', file.size)
        .header('Content-Disposition', `filename=${filename}`)
        .send(stream());
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
    preHandler: downloadGuard,
    async handler(request, reply) {
      const { file, stream } = await fsserve.files(request.query.paths);
      const filename = JSON.stringify(file.name);
      if (file.size !== null) {
        reply.header('Content-Length', file.size);
      }
      return reply
        .type(file.type)
        .header('Content-Disposition', `attachment; filename=${filename}`)
        .send(stream());
    }
  });
  return fastify;
};
