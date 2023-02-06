import ky from 'ky';

const url = new URL(location.origin);
url.port = '8080';
url.pathname = 'api';

export const config = {
  baseUrl: url.toString()
};

export const api = ky.create({ prefixUrl: config.baseUrl });
