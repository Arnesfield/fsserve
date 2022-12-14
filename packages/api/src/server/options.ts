import { readFile } from 'fs/promises';
import { ServerOptions } from 'https';
import { resolve } from 'path';
import { ServeOptions } from '../types/serve.types';

export async function getHttpsOptions(
  options: ServeOptions
): Promise<ServerOptions | null> {
  const { ssl } = options;
  if (!ssl) {
    return null;
  } else if (!ssl.cert) {
    throw new Error('Missing ssl cert file.');
  } else if (!ssl.key) {
    throw new Error('Missing ssl key file.');
  }
  const [cert, key] = await Promise.all([
    readFile(resolve(ssl.cert), 'utf8'),
    readFile(resolve(ssl.key), 'utf8')
  ]);
  return { cert, key };
}
