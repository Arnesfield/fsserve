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
    <p>
      {{ state.error.message }}
    </p>
    <login-form v-if="state.error.statusCode === 401" @auth="reqData.fetch()" />
  </div>
  <main-view v-else-if="state.data" />
</template>
