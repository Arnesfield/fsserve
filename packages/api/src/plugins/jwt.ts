import { FastifyPluginCallback } from 'fastify';
import fastifyPlugin from 'fastify-plugin';
import { FsError } from '../core/error';

export interface JwtOptions {
  /** @default true */
  verify?: boolean;
}

const jwtPlugin: FastifyPluginCallback<JwtOptions> = (fastify, opts, done) => {
  const { verify = true } = opts;
  fastify.addHook('onRequest', async request => {
    try {
      if (verify) await request.jwtVerify();
    } catch {
      throw new FsError(401, 'Not authorized to perform this action.');
    }
  });
  done();
};

export const jwt = fastifyPlugin(jwtPlugin);
