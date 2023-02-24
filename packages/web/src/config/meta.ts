function metaEl<T extends DOMStringMap>(name: string) {
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

const api = metaEl<{ sameOrigin: string }>('api');

const meta = {
  baseUrl: '/api',
  sameOrigin: isTrue(api.sameOrigin, 'false')
};

if (!meta.sameOrigin) {
  const url = new URL(location.origin);
  url.port = '8080';
  url.pathname = 'api';
  meta.baseUrl = url.toString();
}

export { meta };
