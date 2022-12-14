import eslint from '@rollup/plugin-eslint';
import json from '@rollup/plugin-json';
import typescript from '@rollup/plugin-typescript';
import { createRequire } from 'module';
import bundleSize from 'rollup-plugin-bundle-size';
import dts from 'rollup-plugin-dts';
import esbuild from 'rollup-plugin-esbuild';

const pkg = createRequire(import.meta.url)('./package.json');
const input = 'packages/api/src/index.ts';
const WATCH = process.env.ROLLUP_WATCH === 'true';
const external = ['fs/promises', 'http', 'https', 'os', 'path'].concat(
  Object.keys(pkg.dependencies)
);

function dev(options) {
  return { input, external, watch: { skipWrite: true }, ...options };
}

const configs = [
  {
    input,
    output: { file: pkg.types, format: 'esm' },
    plugins: [bundleSize(), dts()],
    external
  },
  // lint and type checking
  dev({ plugins: [eslint(), esbuild(), json()], include: WATCH }),
  dev({ plugins: [typescript(), json()], include: WATCH })
];

export default configs.filter(config => {
  const { include } = config;
  delete config.include;
  return typeof include !== 'boolean' || include;
});
