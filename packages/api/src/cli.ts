import chalk from 'chalk-template';
import { Option, program } from 'commander';
import path from 'path';
import { description, name, version } from '../../../package.json';
import { MAX_FILE_SIZE } from './constants';
import { serve } from './server';
import { ServeOptions } from './types/serve.types';

process.on('SIGINT', () => {
  console.log(chalk`{red Stopped.}`);
  process.exit(130); // Ctrl+C exit code
});

program
  .name(name)
  .description(description)
  .argument('[dir]', 'directory to serve', '.')
  .addOption(
    new Option('-p, --port <port>', 'server port')
      .default(8080)
      .argParser(value => parseInt(value))
  )
  .addOption(
    new Option('-s, --size <size>', 'max file size')
      .default(MAX_FILE_SIZE)
      .argParser(value => parseInt(value))
  )
  .addOption(
    new Option(
      '-o, --operations <operations>',
      'allow DRUM operations: Download, Remove, Upload, Modify'
    ).default('du')
  )
  .version(`v${version}`, '-v, --version');

interface ProgramOptions {
  port: number;
  size: number;
  operations: string;
}

function getOptions(): ServeOptions {
  const options = program.opts<ProgramOptions>();
  const operations = options.operations.toLowerCase();
  return {
    port: options.port,
    size: options.size,
    rootDir: path.resolve(program.processedArgs[0]),
    operations: {
      download: operations.includes('d'),
      remove: operations.includes('r'),
      upload: operations.includes('u'),
      modify: operations.includes('m')
    }
  };
}

async function cli() {
  try {
    program.parse();
    await serve(getOptions());
  } catch (error: unknown) {
    const err =
      error instanceof Error
        ? error
        : { name: 'Error', message: 'An error occurred.' };
    console.error('%s:', err.name, err.message);
    process.exitCode = 1;
  }
}

cli();
