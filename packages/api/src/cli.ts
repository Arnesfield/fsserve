import chalk from 'chalk-template';
import { Command } from 'commander';
import path from 'path';
import { description, name, version } from '../../../package.json';
import { MAX_FILE_SIZE } from './constants';
import { serve } from './server';
import { ServeOptions } from './types/serve.types';

interface ProgramOptions {
  port: number;
  size: number;
  operations: string;
  password?: string;
  secret?: string;
  cert?: string | boolean;
  key?: string | boolean;
}

function createProgram() {
  return new Command()
    .name(name)
    .description(description)
    .argument('[dir]', 'directory to serve', '.')
    .option('-p, --port <port>', 'server port', value => parseInt(value), 8080)
    .option(
      '-s, --size <size>',
      'max file size',
      value => parseInt(value),
      MAX_FILE_SIZE
    )
    .option(
      '-o, --operations <operations>',
      'allow DRUM operations: Download, Remove, Upload, Modify',
      'du'
    )
    .option(
      '-P, --password <password>',
      'require password to access server endpoints'
    )
    .option('-S, --secret <secret>', 'secret key (default: "secret")')
    .option(
      '-C, --cert [cert]',
      'path to cert.pem (default: "cert.pem" when -C or -K options are provided)'
    )
    .option(
      '-K, --key [key]',
      'path to key.pem (default: "key.pem" when -C or -K options are provided'
    )
    .version(`v${version}`, '-v, --version');
}

function getOptions(dir: string, options: ProgramOptions): ServeOptions {
  const operations = options.operations.toLowerCase();
  const ssl: ServeOptions['ssl'] = !(options.cert || options.key)
    ? undefined
    : {
        cert: typeof options.cert === 'string' ? options.cert : 'cert.pem',
        key: typeof options.key === 'string' ? options.key : 'key.pem'
      };
  return {
    port: options.port,
    size: options.size,
    rootDir: path.resolve(dir),
    password: options.password,
    secret: options.secret,
    ssl,
    operations: {
      download: operations.includes('d'),
      remove: operations.includes('r'),
      upload: operations.includes('u'),
      modify: operations.includes('m')
    }
  };
}

export async function cli(
  options?: (options: ServeOptions) => ServeOptions
): Promise<void> {
  process.on('SIGINT', () => {
    console.log(chalk`{red Stopped.}`);
    process.exit(130); // Ctrl+C exit code
  });
  try {
    const program = createProgram().parse();
    const opts = getOptions(
      program.processedArgs[0],
      program.opts<ProgramOptions>()
    );
    await serve(typeof options === 'function' ? options(opts) : opts);
  } catch (error: unknown) {
    const err =
      error instanceof Error
        ? error
        : { name: 'Error', message: 'An error occurred.' };
    console.error('%s:', err.name, err.message);
    process.exitCode = 1;
  }
}
