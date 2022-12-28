import eslint from '@rollup/plugin-eslint';
import json from '@rollup/plugin-json';
import typescript from '@rollup/plugin-typescript';
import { createRequire } from 'module';
import { RollupOptions } from 'rollup';
import dts from 'rollup-plugin-dts';
import esbuild from 'rollup-plugin-esbuild';
import externals from 'rollup-plugin-node-externals';
import outputSize from 'rollup-plugin-output-size';
import type Pkg from './package.json';

const require = createRequire(import.meta.url);
const pkg: typeof Pkg = require('./package.json');
const input = 'packages/api/src/index.ts';
const WATCH = process.env.ROLLUP_WATCH === 'true';
const PROD = !WATCH || process.env.NODE_ENV === 'production';

function defineConfig(options: (false | RollupOptions)[]) {
  return options.filter((options): options is RollupOptions => !!options);
}

export default defineConfig([
  {
    input: { index: input, cli: 'packages/api/src/cli.ts' },
    output: {
      dir: 'lib',
      format: 'esm',
      exports: 'named',
      sourcemap: PROD,
      chunkFileNames: 'core.mjs',
      entryFileNames: '[name].mjs'
    },
    plugins: [esbuild(), json(), externals(), outputSize()]
  },
  {
    input,
    output: {
      file: pkg.main,
      format: 'cjs',
      exports: 'named',
      sourcemap: PROD
    },
    plugins: [esbuild(), json(), externals(), outputSize()]
  },
  {
    input,
    output: { file: pkg.types, format: 'esm' },
    plugins: [dts(), externals(), outputSize()]
  },
  !PROD && {
    input,
    watch: { skipWrite: true },
    plugins: [eslint(), typescript(), json(), externals()]
  }
]);
