import chalk from 'chalk-template';
import { Server } from 'http';
import path from 'path';
import { ServeOptions } from '../types/serve.types';
import { getAddresses } from '../utils/network';
import { createServer } from './server';

export async function serve(options: ServeOptions = {}): Promise<Server> {
  // TODO: transform and convert to validated options
  const port =
    typeof options.port !== 'number'
      ? 8080
      : options.port >= 0 && options.port < 65536
      ? options.port
      : undefined;
  if (typeof port === 'undefined') {
    throw new Error('Port should be a number >= 0 and < 65536.');
  }
  const fastify = await createServer(options);
  fastify.listen({ port, host: '0.0.0.0' }, (error, address) => {
    if (error) {
      console.error('%s:', error.name, error.message);
      process.exitCode = 1;
      return;
    }
    const target =
      path.relative('', path.resolve(options.rootDir || '')) || '.';
    console.log(chalk`{yellow Serving}     {cyan %s/}`, target);
    // operations
    const o = options.operations || {};
    const operations: { allow?: boolean; name: string }[] = [
      { allow: o.download, name: 'Download' },
      { allow: o.remove, name: 'Remove' },
      { allow: o.upload, name: 'Upload' },
      { allow: o.modify, name: 'Modify' }
    ];
    console.log(
      chalk`{yellow Operations}  %s  %s  %s  %s`,
      ...operations.map(operation => {
        const prefix = operation.allow ? 'green \u2714' : 'red \u2718';
        return chalk`{${prefix}} ${operation.name}`;
      })
    );
    // addresses
    const url = new URL(address);
    const addressesLabel = 'Addresses';
    const spaces = ' '.repeat(addressesLabel.length + 1);
    getAddresses().forEach((address, index) => {
      url.hostname = address;
      const label = index > 0 ? spaces : chalk`{yellow ${addressesLabel}} `;
      console.log(chalk`%s  %s`, label, url.toString());
    });
    console.log(chalk`\nPress {cyan Ctrl+C} to {red stop}.`);
  });
  return fastify.server;
}
