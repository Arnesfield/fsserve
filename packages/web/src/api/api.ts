import ky from 'ky';
import { useAuth } from '../config/auth';
import { meta } from '../config/meta';

export const api = ky.create({
  prefixUrl: meta.baseUrl,
  credentials: 'include',
  hooks: {
    beforeRequest: [
      request => {
        const { csrfToken } = useAuth().state.value;
        if (csrfToken) {
          request.headers.set('X-CSRF-Token', csrfToken);
        }
      }
    ]
  }
});
