import eslint from '@rollup/plugin-eslint';
import json from '@rollup/plugin-json';
import { createRequire } from 'module';
import bundleSize from 'rollup-plugin-bundle-size';
import dts from 'rollup-plugin-dts';
import esbuild from 'rollup-plugin-esbuild';

const pkg = createRequire(import.meta.url)('./package.json');
const input = 'packages/api/src/index.ts';
const WATCH = process.env.ROLLUP_WATCH === 'true';
const external = Object.keys(pkg.dependencies).concat(
  'fs',
  'fs/promises',
  'http',
  'https',
  'os',
  'path',
  'stream'
);

const configs = [
  {
    input,
    output: { file: pkg.types, format: 'esm' },
    plugins: [bundleSize(), dts()],
    external
  },
  {
    input,
    plugins: [eslint(), esbuild(), json()],
    external,
    watch: { skipWrite: true },
    $include: WATCH
  }
];

export default configs.filter(config => {
  const { $include } = config;
  delete config.$include;
  return typeof $include !== 'boolean' || $include;
});
