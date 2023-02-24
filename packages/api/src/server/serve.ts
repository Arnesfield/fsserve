import chalk from 'chalk-template';
import { Server } from 'http';
import path from 'path';
import { Operation } from '../types/operation.types';
import { ServeOptions } from '../types/serve.types';
import { getAddresses } from '../utils/network';
import { createServer } from './server';

export async function serve(options: ServeOptions = {}): Promise<Server> {
  const port =
    typeof options.port !== 'number'
      ? 8080
      : options.port >= 0 && options.port < 65536
      ? options.port
      : undefined;
  if (typeof port === 'undefined') {
    throw new Error('Port should be a number >= 0 and < 65536.');
  }
  const addresses = getAddresses();
  const fastify = await createServer(options, addresses);
  const address = await fastify.listen({ port, host: '0.0.0.0' });
  const target = path.relative('', path.resolve(options.rootDir || '')) || '.';
  console.log(chalk`{yellow Serving}     {cyan %s/}`, target);
  // operations
  const o = options.operations || {};
  const operations = Object.entries(Operation).map(([name, operation]) => {
    return { allow: !!o[operation], name };
  });
  console.log(
    chalk`{yellow Operations}` + '  %s'.repeat(operations.length),
    ...operations.map(operation => {
      const prefix = operation.allow ? 'green \u2714' : 'red \u2718';
      return chalk`{${prefix}} ${operation.name}`;
    })
  );
  // addresses
  const url = new URL(address);
  const addressesLabel = 'Addresses';
  const spaces = ' '.repeat(addressesLabel.length + 1);
  addresses.forEach((address, index) => {
    url.hostname = address;
    const label = index > 0 ? spaces : chalk`{yellow ${addressesLabel}} `;
    console.log(chalk`%s  %s`, label, url.toString());
  });
  console.log(chalk`\nPress {cyan Ctrl+C} to {red stop}.`);
  return fastify.server;
}
