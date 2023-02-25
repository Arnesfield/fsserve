import { MultipartValue } from '@fastify/multipart';
import type { JSONSchemaType } from 'ajv';
import contentDisposition from 'content-disposition';
import {
  FastifyInstance,
  FastifyPluginCallback,
  FastifyRequest,
  RouteGenericInterface
} from 'fastify';
import send from 'send';
import { FsError } from '../core/error';
import { FsServe } from '../core/fsserve';
import { guard } from '../plugins/guard';
import { jwt } from '../plugins/jwt';
import { Operation } from '../types/operation.types';
import { ServeOptions } from '../types/serve.types';

export interface FileRoutesOptions {
  fsserve: FsServe;
  options: ServeOptions;
}

export const fileRoute: FastifyPluginCallback<FileRoutesOptions> = (
  fastify,
  opts,
  done
) => {
  const { options } = opts;
  fastify.register(jwt, { verify: !!options.password });
  const route = new FileRoute(opts.fsserve);
  route.root(fastify);
  // download
  fastify.register((instance, _opts, done) => {
    instance.register(guard, { options, operations: Operation.Download });
    route.view(instance);
    route.download(instance);
    done();
  });
  // upload
  route.uploadOptions(fastify);
  fastify.register((instance, _opts, done) => {
    instance.register(guard, { options, operations: Operation.Upload });
    route.upload(instance);
    done();
  });
  done();
};

class FileRoute {
  constructor(protected readonly fsserve: FsServe) {}

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

  protected send(request: FastifyRequest, filePath: string) {
    return send(request.raw, filePath, { acceptRanges: true });
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
        const file = await this.fsserve.file(request.query.path);
        return reply
          .header(
            'Content-Disposition',
            contentDisposition(file.name, { type: 'inline' })
          )
          .send(this.send(request, file.path));
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
        const collection = await this.fsserve.files(request.query.paths);
        const { file } = collection;
        reply.header('Content-Disposition', contentDisposition(file.name));
        if (!collection.virtual) {
          return reply.send(this.send(request, file.path));
        }
        return reply.type(file.type).send(collection.stream());
      }
    });
  }

  // OPTIONS /
  uploadOptions(fastify: FastifyInstance) {
    fastify.options('/', (_request, reply) => reply.status(200).send());
  }

  // POST /
  upload(fastify: FastifyInstance) {
    fastify.post('/', async (request, reply) => {
      const data = await request.file();
      if (!data) {
        throw new FsError(400, 'No file to upload.');
      }
      const pathField = data.fields.path;
      const pathPart = (Array.isArray(pathField) ? pathField[0] : pathField) as
        | MultipartValue<string>
        | undefined;
      const path = pathPart?.value;
      if (path != null && typeof path !== 'string') {
        throw new FsError(400, 'Not a valid upload path.');
      }
      const target = await this.fsserve.upload(data.file, data.filename, path);
      const file = await this.fsserve.file(target);
      return reply.status(200).send(file);
    });
  }
}
