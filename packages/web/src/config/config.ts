import { defineStore, storeToRefs } from 'pinia';
import { computed, onUnmounted } from 'vue';
import { api } from '../api/api';
import { useFetch } from '../utils/fetch';
import { useAuth } from './auth';

interface OperationMap {
  download?: boolean;
  remove?: boolean;
  upload?: boolean;
  modify?: boolean;
}

export interface Config {
  operations: OperationMap;
}

const configStore = defineStore('config', () => {
  const { validate } = useAuth();
  const reqData = useFetch(async signal => {
    try {
      return await api.get('data', { signal }).json<Config>();
    } catch (error) {
      // validate when data fetch fails
      validate();
      throw error;
    }
  });
  // refetch on window focus
  reqData.fetch();
  const focus = () => {
    reqData.fetch();
  };
  window.addEventListener('focus', focus);
  onUnmounted(() => {
    window.removeEventListener('focus', focus);
  });

  const config = computed((): Config => {
    return reqData.state.data || { operations: {} };
  });

  return { config, reqData };
});

export function useConfig() {
  const store = configStore();
  const { reqData } = store;
  return { ...storeToRefs(store), reqData };
}
