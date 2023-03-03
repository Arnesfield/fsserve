import { FastifyPluginCallback } from 'fastify';
import fastifyPlugin from 'fastify-plugin';
import { FsError } from '../core/error';
import { Operation } from '../types/operation.types';
import { ServeOptions } from '../types/serve.types';

export interface GuardOptions {
  options: Pick<ServeOptions, 'operations'>;
  operations: Operation | Operation[];
}

const guardPlugin: FastifyPluginCallback<GuardOptions> = (
  fastify,
  opts,
  done
) => {
  const allOpertations = opts.options.operations;
  const operations = Array.isArray(opts.operations)
    ? opts.operations
    : [opts.operations];
  fastify.addHook('onRequest', (_request, _reply, done) => {
    const valid =
      !allOpertations ||
      operations.every(operation => allOpertations[operation]);
    const error = valid
      ? undefined
      : new FsError(403, 'Not authorized to perform this action.');
    done(error);
  });
  done();
};

export const guard = fastifyPlugin(guardPlugin);
