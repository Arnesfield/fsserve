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
    const { origin } = request.getUrl();
    if (origins.includes(origin)) {
      reply
        .header('Access-Control-Allow-Origin', origin)
        .header('Access-Control-Allow-Credentials', true)
        .header('Access-Control-Allow-Headers', 'Content-Type, X-CSRF-Token')
        .header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      if (request.method === 'OPTIONS') {
        reply.status(200).send();
      }
    }
    done();
  });
  done();
};

export const cors = fastifyPlugin(corsPlugin);
