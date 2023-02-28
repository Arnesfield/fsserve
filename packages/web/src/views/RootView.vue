<script setup lang="ts">
import LoginForm from '../components/LoginForm.vue';
import { useConfig } from '../config/config';
import MainView from './MainView.vue';

const { reqData } = useConfig();
const { state } = reqData;
</script>

<template>
  <div v-if="!state.data && !state.error && state.isLoading">Loading...</div>
  <div v-else-if="state.error">
    <login-form v-if="state.error.statusCode === 401" />
    <p v-else>
      {{ state.error.message }}
    </p>
  </div>
  <main-view v-else-if="state.data" />
</template>
