import { defineStore, storeToRefs } from 'pinia';
import { computed, onUnmounted } from 'vue';
import { api } from '../api/api';
import { useFetch } from '../utils/fetch';

interface OperationMap {
  download?: boolean;
  remove?: boolean;
  upload?: boolean;
  modify?: boolean;
}

const configStore = defineStore('config', () => {
  const reqApi = useFetch(() => {
    return api.get('').json<{ operations: OperationMap }>();
  });
  // refetch on window focus
  reqApi.fetch();
  const focus = () => {
    reqApi.fetch();
  };
  window.addEventListener('focus', focus);
  onUnmounted(() => {
    window.removeEventListener('focus', focus);
  });

  const config = computed(() => {
    const operations = reqApi.state.data?.operations || {};
    return { operations };
  });

  return { config };
});

export function useConfig() {
  return storeToRefs(configStore());
}
