type Operation = 'download' | 'remove' | 'upload' | 'modify';

function meta<T extends DOMStringMap>(name: string) {
  const metaEl = document.querySelector<HTMLMetaElement>(
    `meta[name="${name}"]`
  );
  return (metaEl?.dataset || {}) as { [K in keyof T]: T[K] | undefined };
}

function isTrue(value: string | undefined, defaultValue: string) {
  const v =
    typeof value === 'undefined' || value.startsWith('<%=')
      ? defaultValue
      : value;
  return v === 'true';
}

const env = import.meta.env;
const api = meta<{ sameOrigin: string }>('api');
const apiOperations = meta<Record<Operation, string>>('api.operations');

const config = {
  baseUrl: '/api',
  sameOrigin: isTrue(api.sameOrigin, 'false'),
  operations: Object.keys(apiOperations).reduce((operations, key) => {
    const operation = key as Operation;
    // allow all operations during DEV
    operations[operation] =
      env.DEV ||
      isTrue(apiOperations[operation], (operation === 'download').toString());
    return operations;
  }, {} as Record<Operation, boolean>)
};

if (!config.sameOrigin) {
  const url = new URL(location.origin);
  url.port = '8080';
  url.pathname = 'api';
  config.baseUrl = url.toString();
}

export { config };
