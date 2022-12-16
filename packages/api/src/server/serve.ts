import { Server } from 'http';
import path from 'path';
import { ServeOptions } from '../types/serve.types';
import { getNetworks } from '../utils/network';
import { validatePort } from '../utils/validator';
import { createServer } from './server';

export async function serve(options: ServeOptions = {}): Promise<Server> {
  const port =
    typeof options.port !== 'number' ? 8080 : validatePort(options.port);
  const fastify = await createServer(options);
  fastify.listen({ port }, (error, address) => {
    if (error) {
      process.exitCode = 1;
      return;
    }
    const target =
      path.relative('', path.resolve(options.rootDir || '')) || '.';
    const url = new URL(address);
    url.hostname = 'localhost';
    console.log('Serving:', target);
    console.log('-', url.toString());
    for (const network of getNetworks()) {
      url.hostname = network.address;
      console.log('-', url.toString());
    }
  });
  return fastify.server;
}
