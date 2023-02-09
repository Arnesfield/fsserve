<script setup lang="ts">
import { computed } from 'vue';
import type { UploadItem } from '../utils/uploader';

const props = defineProps<{ items: UploadItem[] }>();
defineEmits<{ (event: 'remove', item: UploadItem): void }>();

const uploaded = computed(() => {
  return props.items.filter(item => item.status === 'done');
});
</script>

<template>
  <div>
    <div>
      Uploading <strong>{{ uploaded.length }}</strong> of
      <strong>{{ items.length }}</strong> File{{
        items.length === 1 ? '' : 's'
      }}
    </div>
    <div v-if="props.items.length === 0">Nothing to upload :(</div>
    <ul v-else>
      <li class="upload-item" :key="item.id" v-for="item of props.items">
        <button type="button" @click="$emit('remove', item)">x</button>
        <span>
          <strong>{{ item.file.name }}</strong>
          <template v-if="item.status !== 'init'"> - </template>
          <template v-if="item.status === 'done'">Done</template>
          <template v-else-if="item.status === 'aborted'">Cancelled</template>
          <template v-else-if="item.status === 'error'">
            {{ item.error ? item.error.message : 'An error occurred.' }}
          </template>
          <template v-else-if="item.status === 'uploading'">
            {{ item.progress }}%
          </template>
        </span>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.upload-item button {
  margin-right: 8px;
}
</style>
