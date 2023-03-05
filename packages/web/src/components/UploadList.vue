<script setup lang="ts">
import { computed } from 'vue';
import type { UploadAction, UploadItem } from '../utils/uploader';
import UploadListItem from './UploadListItem.vue';

const props = defineProps<{ items: UploadItem[] }>();
defineEmits<{
  (event: 'cancel', item: UploadItem): void;
  (event: 'remove', item: UploadItem): void;
  (event: 'retry', item: UploadItem, action?: UploadAction): void;
}>();

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
      <UploadListItem
        v-for="item of props.items"
        :item="item"
        :key="item.id"
        @cancel="$emit('cancel', item)"
        @remove="$emit('remove', item)"
        @retry="action => $emit('retry', item, action)"
      />
    </ul>
  </div>
</template>
