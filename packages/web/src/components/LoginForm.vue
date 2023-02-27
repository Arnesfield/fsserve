<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useAuth } from '../config/auth';

const emit = defineEmits<{ (event: 'auth'): void }>();

const input = ref<HTMLInputElement>();
const form = reactive({ password: '' });
const { reqAuth, login } = useAuth();
const { state } = reqAuth;

const submit = async () => {
  if (state.isLoading) return;
  const [, data] = await login(form);
  if (data) emit('auth');
  // focus input again
  input.value?.focus();
};

onMounted(() => {
  input.value?.focus();
});
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
