import { MultipartValue } from '@fastify/multipart';
import type { JSONSchemaType } from 'ajv';
import contentDisposition from 'content-disposition';
import {
  FastifyInstance,
  FastifyPluginCallback,
  FastifyReply,
  RouteGenericInterface
} from 'fastify';
import { MAX_FILE_SIZE } from '../constants';
import { FsError } from '../core/error';
import { FsServe } from '../core/fsserve';
import { guard } from '../plugins/guard';
import { jwt } from '../plugins/jwt';
import { UploadAction } from '../types/core.types';
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
  const route = new FileRoute(opts.fsserve, options);
  route.root(fastify);
  // download
  fastify.register((instance, _opts, done) => {
    instance.register(guard, { options, operations: Operation.Download });
    route.view(instance);
    route.download(instance);
    done();
  });
  // upload
  fastify.register((instance, _opts, done) => {
    instance.register(guard, { options, operations: Operation.Upload });
    route.upload(instance);
    done();
  });
  done();
};

class FileRoute {
  constructor(
    protected readonly fsserve: FsServe,
    protected readonly options: ServeOptions
  ) {}

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

  protected sendFile(reply: FastifyReply, path: string) {
    return reply.sendFile(path, this.options.rootDir || process.cwd(), {
      acceptRanges: true,
      cacheControl: false,
      dotfiles: 'allow'
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
        const file = await this.fsserve.file(request.query.path);
        reply.header(
          'Content-Disposition',
          contentDisposition(file.name, { type: 'inline' })
        );
        return this.sendFile(reply, file.path);
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
          return this.sendFile(reply, file.path);
        }
        return reply.type(file.type).send(collection.stream());
      }
    });
  }

  // POST /
  upload(fastify: FastifyInstance) {
    fastify.post('/', {
      onRequest: fastify.csrfProtection,
      onError: (_, reply, error) => {
        // close the connection to avoid continuing the upload, taken from:
        // https://github.com/fastify/fastify-multipart/issues/131#issuecomment-650658315
        reply.header('Connection', 'close').send(error);
      },
      handler: async (request, reply) => {
        const data = await request.file();
        if (!data) {
          throw new FsError(400, 'No file to upload.');
        }
        const fields = data.fields as {
          action?: MultipartValue<UploadAction>;
          path?: MultipartValue<string>;
          size?: MultipartValue<string>;
        };
        const path = fields.path?.value;
        if (path != null && typeof path !== 'string') {
          throw new FsError(400, 'Not a valid upload path.');
        }
        const size = parseInt(`${fields.size?.value}`);
        if (!isFinite(size)) {
          throw new FsError(400, 'Missing file size.');
        } else if (size > (this.options.size ?? MAX_FILE_SIZE)) {
          throw new fastify.multipartErrors.RequestFileTooLargeError();
        }
        const upload = await this.fsserve.upload({
          stream: data.file,
          file: { name: data.filename, size },
          action: fields.action?.value,
          path
        });
        const file = await this.fsserve.file(upload.path);
        return reply.status(upload.created ? 201 : 200).send(file);
      }
    });
  }
}
