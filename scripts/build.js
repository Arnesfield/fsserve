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
const eslint = [!ARGS.noCheck && ARGS.production && 'npm:lint:strict'];
const tsc = [
  !ARGS.noCheck && 'tsc',
  '--noEmit',
  ARGS.watch && '-w --preserveWatchOutput'
];
const scripts = { cjs, esm, rollup, eslint, tsc };

const commands = Object.entries(scripts)
  .filter(([_, script]) => script[0])
  .map(([key, script]) => {
    /** @type {import('concurrently').ConcurrentlyCommandInput */
    const cmd = { name: key, command: script.filter(s => s).join(' ') };
    return cmd;
  });

const { result } = concurrently(commands, {
  prefix: 'name',
  raw: !ARGS.watch,
  killOthers: 'failure',
  prefixColors: ['grey']
});
result.catch(error => {
  /** @type {import('concurrently').CloseEvent[]} */
  const events = Array.isArray(error) ? error : [];
  const event = events.find(
    event => typeof event.exitCode === 'number' && event.exitCode !== 0
  );
  process.exitCode = event ? event.exitCode : 1;
});
