import { defineStore, storeToRefs } from 'pinia';
import { reactive } from 'vue';
import { api } from '../api/api';
import { useFetch } from '../utils/fetch';

export interface AuthData {
  csrfToken: string | null;
}

const authStore = defineStore('auth', () => {
  const state = reactive<AuthData>({ csrfToken: null });
  const reqAuth = useFetch<{ ok: true }>();
  const reqValidate = useFetch(() => {
    return api.get('validate').json<{ csrfToken: string }>();
  });

  function login(payload: { password: string }) {
    return reqAuth.fetch(() => {
      return api.post('auth', { json: payload }).json();
    });
  }

  async function validate() {
    const result = await reqValidate.fetch();
    const [, data] = result;
    // NOTE: store csrf token in memory only
    if (data) {
      state.csrfToken = data.csrfToken;
    }
    return result;
  }
  // run validate once
  validate();

  return { reqAuth, reqValidate, state, login, validate };
});

export function useAuth() {
  const store = authStore();
  const { reqAuth, reqValidate, login, validate } = store;
  return { ...storeToRefs(store), reqAuth, reqValidate, login, validate };
}
