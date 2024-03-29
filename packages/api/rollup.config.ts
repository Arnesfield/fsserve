import eslint from '@rollup/plugin-eslint';
import json from '@rollup/plugin-json';
import typescript from '@rollup/plugin-typescript';
import { createRequire } from 'module';
import { RollupOptions } from 'rollup';
import dts from 'rollup-plugin-dts';
import esbuild from 'rollup-plugin-esbuild';
import externals from 'rollup-plugin-node-externals';
import outputSize from 'rollup-plugin-output-size';
import type Pkg from '../../package.json';

const root = '../../';
const require = createRequire(import.meta.url);
const pkg: typeof Pkg = require(root + 'package.json');
const input = 'src/index.ts';
const WATCH = process.env.ROLLUP_WATCH === 'true';
const PROD = !WATCH || process.env.NODE_ENV === 'production';

function defineConfig(options: (false | RollupOptions)[]) {
  return options.filter((options): options is RollupOptions => !!options);
}

export default defineConfig([
  {
    input,
    output: {
      file: root + pkg.module,
      format: 'esm',
      exports: 'named',
      sourcemap: PROD
    },
    plugins: [esbuild(), json(), externals(), outputSize()]
  },
  {
    input,
    output: {
      file: root + pkg.main,
      format: 'cjs',
      exports: 'named',
      sourcemap: PROD
    },
    plugins: [esbuild(), json(), externals(), outputSize()]
  },
  {
    input,
    output: { file: root + pkg.types, format: 'esm' },
    plugins: [dts(), externals(), outputSize()]
  },
  !PROD && {
    input,
    watch: { skipWrite: true },
    plugins: [
      eslint({ overrideConfigFile: '.eslintrc.cjs' }),
      typescript(),
      json(),
      externals()
    ]
  }
]);
