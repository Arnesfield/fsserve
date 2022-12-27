<script setup lang="ts">
import { ref } from 'vue';

const list = ref([1, 2, 3]);
</script>

<template>
  <v-list lines="one">
    <template v-for="item of list" :key="item">
      <v-list-item :title="`Title ${item}`" subtitle="Lorem ipsum" />
    </template>
  </v-list>
</template>
