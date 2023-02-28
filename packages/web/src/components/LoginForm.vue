<script setup lang="ts">
import { nextTick, onMounted, reactive, ref } from 'vue';
import { useAuth } from '../config/auth';
import { useConfig } from '../config/config';
import type { FetchError } from '../utils/fetch';

const input = ref<HTMLInputElement>();
const form = reactive({ password: '' });
const state = reactive<{ isLoading: boolean; error?: FetchError }>({
  isLoading: false
});
const { login } = useAuth();
const { reqData } = useConfig();

function focus() {
  input.value?.focus();
}
onMounted(focus);

async function submit() {
  if (state.isLoading) return;
  state.isLoading = true;
  state.error = undefined;
  const [loginError, data] = await login(form);
  if (loginError) state.error = loginError;
  if (data) {
    const [dataError] = await reqData.fetch();
    if (dataError) state.error = dataError;
  }
  state.isLoading = false;
  // focus input again
  nextTick(focus);
}
</script>

<template>
  <form @submit.prevent="submit">
    <div>
      <label for="password">Password</label>
      <input
        ref="input"
        id="password"
        type="password"
        autocomplete="current-password"
        :disabled="state.isLoading"
        v-model="form.password"
      />
    </div>
    <button type="submit" :disabled="state.isLoading">Login</button>
    <div v-if="state.isLoading">Loading...</div>
    <div v-else-if="state.error">{{ state.error.message }}</div>
  </form>
</template>
