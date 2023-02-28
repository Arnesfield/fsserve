// use sameOrigin for non dev environment
const meta = { baseUrl: '/api', sameOrigin: !import.meta.env.DEV };

if (!meta.sameOrigin) {
  const url = new URL(location.origin);
  url.port = '8080';
  url.pathname = 'api';
  meta.baseUrl = url.toString();
}

export { meta };
