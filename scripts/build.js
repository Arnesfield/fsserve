import concurrently from 'concurrently';

/** @type {Record<string, boolean>} */
const args = {};
for (const arg of process.argv.slice(2)) {
  args[arg] = true;
}
const ARGS = {
  watch: args['-w'],
  production: !args['-w'] || args['-p'],
  isNode: true,
  js: args['--js'],
  rollup: args['--rollup'],
  noCheck: args['--no-check']
};

/** @param {(string | false)[]} options */
function esbuild(options) {
  return [
    (ARGS.js || !ARGS.rollup) && 'esbuild',
    ...options,
    '--bundle',
    '--outdir=lib',
    '--packages=external',
    ARGS.isNode && '--platform=node',
    ARGS.watch && '--watch',
    ARGS.production && '--sourcemap'
  ];
}

const input = 'packages/api/src/index.ts';

const check = [!ARGS.watch && !ARGS.noCheck && 'npm:check'];
const cjs = esbuild([input, '--format=cjs', '--out-extension:.js=.cjs']);
const esm = esbuild([
  input,
  'packages/api/src/cli.ts',
  '--format=esm',
  '--out-extension:.js=.mjs',
  '--splitting',
  '--chunk-names=[name]',
  ARGS.watch && '--log-level=silent'
]);
const rollup = [
  (!ARGS.js || ARGS.rollup) && 'rollup',
  '-c',
  ARGS.watch && '--watch --no-watch.clearScreen',
  ARGS.production && '--environment NODE_ENV:production'
];

const commands = [check, cjs, esm, rollup]
  .filter(script => script[0])
  .map(script => script.filter(s => s).join(' '));

const { result } = concurrently(commands, { raw: true, killOthers: 'failure' });
result.catch(error => {
  /** @type {import('concurrently').CloseEvent[]} */
  const events = Array.isArray(error) ? error : [];
  const event = events.find(
    event => typeof event.exitCode === 'number' && event.exitCode !== 0
  );
  process.exitCode = event ? event.exitCode : 1;
});
