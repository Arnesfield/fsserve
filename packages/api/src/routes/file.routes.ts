import type { JSONSchemaType } from 'ajv';
import { FastifyInstance, RouteGenericInterface } from 'fastify';
import { FsError } from '../core/error';
import { FsServe } from '../core/fsserve';
import { Operation } from '../types/operation.types';
import {
  FsServePluginCallback,
  FsServePluginOptions
} from '../types/plugin.types';
import { ServeOptions } from '../types/serve.types';

// TODO: maybe move into a different file
function guard(options: ServeOptions, ...operations: Operation[]) {
  const allOperations = options.operations;
  const valid =
    !allOperations || operations.every(operation => allOperations[operation]);
  if (!valid) {
    return new FsError(
      403,
      'Not authorized to perform this action.',
      ...operations
    );
  }
}

export const fileRoutes: FsServePluginCallback = (fastify, opts, done) => {
  const { ctx } = opts;
  const route = new FileRoutes(ctx);
  route.root(fastify);
  // download only
  fastify.register((instance, _opts, done) => {
    instance.addHook('onRequest', (_request, _reply, done) => {
      done(guard(ctx.options, Operation.Download));
    });
    route.view(instance);
    route.download(instance);
    done();
  });
  done();
};

class FileRoutes {
  protected readonly fsserve: FsServe;

  constructor(ctx: FsServePluginOptions['ctx']) {
    this.fsserve = ctx.fsserve;
  }

  // GET /
  root(fastify: FastifyInstance) {
    interface Schema extends RouteGenericInterface {
      Querystring: { path?: string };
    }
    fastify.get<Schema>('/', {
      schema: {
        querystring: <JSONSchemaType<Schema['Querystring']>>{
          type: 'object',
          properties: { path: { type: 'string' } }
        }
      },
      handler: request => this.fsserve.browse(request.query.path)
    });
  }

  // GET /view
  view(fastify: FastifyInstance) {
    interface Schema extends RouteGenericInterface {
      Querystring: { path: string };
    }
    fastify.get<Schema>('/view', {
      schema: {
        querystring: <JSONSchemaType<Schema['Querystring']>>{
          type: 'object',
          required: ['path'],
          properties: { path: { type: 'string' } }
        }
      },
      handler: async (request, reply) => {
        const { file, stream } = await this.fsserve.file(request.query.path);
        const filename = JSON.stringify(file.name);
        return reply
          .type(file.type)
          .header('Content-Length', file.size)
          .header('Content-Disposition', `filename=${filename}`)
          .send(stream());
      }
    });
  }

  // GET /download
  download(fastify: FastifyInstance) {
    interface Schema extends RouteGenericInterface {
      Querystring: { paths: string[] };
    }
    fastify.get<Schema>('/download', {
      schema: {
        querystring: <JSONSchemaType<Schema['Querystring']>>{
          type: 'object',
          required: ['paths'],
          properties: {
            paths: { type: 'array', minItems: 1, items: { type: 'string' } }
          }
        }
      },
      handler: async (request, reply) => {
        const { file, stream } = await this.fsserve.files(request.query.paths);
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
  }
}
