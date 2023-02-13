import { FastifyPluginCallback } from 'fastify';
import fastifyPlugin from 'fastify-plugin';

export interface CorsOptions {
  addresses: string[];
}

const corsPlugin: FastifyPluginCallback<CorsOptions> = (
  fastify,
  options,
  done
) => {
  const url = new URL('http://localhost:8082');
  const origins = options.addresses.map(address => {
    url.hostname = address;
    const str = url.toString();
    return str.endsWith('/') ? str.slice(0, -1) : str;
  });
  fastify.addHook('onRequest', (request, reply, done) => {
    const origin = request.headers.origin;
    if (origin && origins.includes(origin)) {
      reply.header('Access-Control-Allow-Origin', origin);
      reply.header('Access-Control-Allow-Headers', 'Content-Type');
      reply.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    }
    done();
  });
  done();
};

export const cors = fastifyPlugin(corsPlugin);
