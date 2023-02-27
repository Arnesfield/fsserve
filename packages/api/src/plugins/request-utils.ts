import { CookieSerializeOptions } from '@fastify/cookie';
import { FastifyPluginCallback } from 'fastify';
import fastifyPlugin from 'fastify-plugin';

declare module 'fastify' {
  interface FastifyRequest {
    getUrl(): URL;
    getCookieOptions(): CookieSerializeOptions;
  }
}

const requestUtilsPlugin: FastifyPluginCallback = (fastify, _opts, done) => {
  fastify.decorateRequest('getUrl', function (): URL {
    const { origin, referer } = this.headers;
    const host = `${this.protocol}://${this.hostname}`;
    try {
      return new URL(origin || referer || host);
    } catch {
      return new URL(host);
    }
  });
  fastify.decorateRequest(
    'getCookieOptions',
    function (): CookieSerializeOptions {
      const url = this.getUrl();
      const isSameSite = url.origin === `${this.protocol}://${this.hostname}`;
      return {
        domain: url.hostname,
        path: '/',
        signed: true,
        httpOnly: true,
        secure: !isSameSite || this.protocol === 'https',
        sameSite: isSameSite ? 'strict' : 'lax'
      };
    }
  );
  done();
};

export const requestUtils = fastifyPlugin(requestUtilsPlugin);
