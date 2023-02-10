import ky from 'ky';

interface ApiData extends DOMStringMap {
  sameOrigin: string;
}

const meta = document.querySelector<HTMLMetaElement>('meta[name="api"]');
const data: ApiData = meta ? (meta.dataset as ApiData) : { sameOrigin: '' };

function getBaseUrl() {
  if (data.sameOrigin === 'true') {
    return '/api';
  }
  const url = new URL(location.origin);
  url.port = '8080';
  url.pathname = 'api';
  return url.toString();
}

export const config = {
  baseUrl: getBaseUrl()
};

export const api = ky.create({ prefixUrl: config.baseUrl });
