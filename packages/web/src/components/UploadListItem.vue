<script setup lang="ts">
import { computed } from 'vue';
import type { UploadAction, UploadItem } from '../utils/uploader';

const props = defineProps<{ item: UploadItem }>();
defineEmits<{
  (event: 'cancel'): void;
  (event: 'remove'): void;
  (event: 'retry', action?: UploadAction): void;
}>();

const errorMetadata = computed(() => props.item.error?.metadata);

// NOTE: taken from https://stackoverflow.com/a/18358056/7013346
const progress = computed(() => {
  return +(Math.round(+`${props.item.progress}e+2`) + 'e-2');
});
</script>

<template>
  <li class="upload-item">
    <button type="button" @click="$emit('remove')">x</button>
    <span>
      <strong>{{ item.file.name }}</strong>
      <template v-if="item.status !== 'init'"> - </template>
      <template v-if="item.status === 'done'"
        >Done
        <template v-if="item.response && item.response.name !== item.file.name">
          (Uploaded as <strong>{{ item.response.name }}</strong
          >)
        </template>
      </template>
      <template v-else-if="item.status === 'uploading'">
        Uploading: {{ progress }}%
        <div>
          <button type="button" @click="$emit('cancel')">Cancel</button>
        </div>
      </template>
      <template v-else-if="item.status === 'aborted'">Cancelled</template>
      <template v-else-if="item.status === 'error'">
        {{ item.error ? item.error.message : 'An error occurred.' }}
      </template>
      <div v-if="['aborted', 'error'].includes(item.status)">
        <button
          v-if="!errorMetadata || errorMetadata.actions.length === 0"
          type="button"
          @click="$emit('retry')"
        >
          Retry
        </button>
        <template v-if="errorMetadata">
          <button
            v-for="action of errorMetadata.actions"
            type="button"
            :key="action"
            @click="$emit('retry', action)"
          >
            {{ action }}
          </button>
        </template>
      </div>
    </span>
  </li>
</template>

<style scoped>
.upload-item button {
  margin-right: 8px;
}
</style>
