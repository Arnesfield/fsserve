<script setup lang="ts">
import qs from 'qs';
import { computed, reactive, ref, watch } from 'vue';
import { useRoute, type RouteLocationRaw } from 'vue-router';
import { api } from '../api/api';
import ListItem from '../components/ListItem.vue';
import UploadList from '../components/UploadList.vue';
import { useConfig } from '../config/config';
import { meta } from '../config/meta';
import type { FsFile, FsObject } from '../types/core.types';
import { createDate } from '../utils/date';
import { useFetch } from '../utils/fetch';
import { title } from '../utils/title';
import { UploadAction, useUploader, type UploadItem } from '../utils/uploader';

// TODO: separate components?

const route = useRoute();
const path = computed(() => {
  const qp = route.query.path;
  return Array.isArray(qp) ? qp[0] : typeof qp === 'string' ? qp : null;
});
watch(path, () => title(path.value));

const input = ref<HTMLInputElement>();
const content = ref<HTMLDivElement>();
const paths = reactive<string[]>([]);
const state = reactive({ showUploads: false });
const { config } = useConfig();
const uploader = useUploader('files');
const reqFiles = useFetch(signal => {
  const params = qs.stringify({ path: path.value });
  return api.get('files', { signal, searchParams: params }).json<FsObject[]>();
});

const files = computed(() => reqFiles.state.data || []);
const isSelectedAll = computed(() => {
  return (
    files.value.length > 0 &&
    files.value.every(file => paths.includes(file.path))
  );
});
const parentPath = computed((): RouteLocationRaw => {
  const p = path.value || '';
  const index = p.lastIndexOf('/');
  const parentPath = index > -1 ? p.slice(0, index) : '';
  return parentPath ? { query: { path: parentPath } } : p ? '/' : '';
});
const disableUp = computed(() => !parentPath.value || reqFiles.state.isLoading);

async function fetchFiles() {
  const [, items] = await reqFiles.fetch();
  if (items) {
    // remove paths not in items
    const updatedPaths = paths.filter(path => {
      return items.some(item => item.kind === 'file' && item.path === path);
    });
    paths.splice(0, paths.length, ...updatedPaths);
  }
}
fetchFiles();
watch(route, () => fetchFiles());
watch(files, () => {
  // scroll back up when changing directories
  if (content.value) {
    content.value.scrollTop = 0;
  }
});

async function download() {
  const a = document.createElement('a');
  a.href =
    meta.baseUrl +
    '/files/download?' +
    qs.stringify({ paths }, { arrayFormat: 'repeat' });
  a.target = '_blank';
  a.click();
}

function handleUpload() {
  input.value?.click();
}

function upload(event: Event) {
  const fileList = (event.target as HTMLInputElement).files;
  const files = fileList ? Array.from(fileList) : [];
  // on upload, show the list
  if (files.length > 0) {
    state.showUploads = true;
  }
  for (const file of files) {
    uploader.upload(file, { path: path.value });
  }
  // clear input field
  if (input.value) {
    input.value.value = '';
  }
}

function getViewApiPath(item: FsFile) {
  const params = new URLSearchParams({ path: item.path }).toString();
  return `${meta.baseUrl}/files/view?${params}`;
}

function handleCheck(item: FsObject) {
  if (!config.value.operations.download) return;
  const index = paths.indexOf(item.path);
  if (index > -1) {
    paths.splice(index, 1);
  } else if (index < 0) {
    paths.push(item.path);
  }
}

function selectAll() {
  const items = isSelectedAll.value ? [] : files.value.map(file => file.path);
  paths.splice(0, paths.length, ...items);
}

function removeUploadItem(item: UploadItem) {
  uploader.remove(item.file);
  if (uploader.items.length === 0) {
    state.showUploads = false;
  }
}

function retryUploadItem(item: UploadItem, action?: UploadAction) {
  // include start when resuming upload
  const start =
    action === UploadAction.Resume
      ? item.error?.metadata?.file?.size
      : undefined;
  uploader.upload(item.file, { action, start, path: path.value });
}
</script>

<template>
  <main>
    <header class="container">
      <component
        class="up"
        :to="parentPath"
        :is="disableUp ? 'span' : 'router-link'"
      >
        <button type="button" :disabled="disableUp">Up</button>
      </component>
      <!-- NOTE: taken from https://stackoverflow.com/a/24800788/7013346 -->
      <h3>
        <bdi>{{ path || 'Files' }}</bdi>
      </h3>
    </header>
    <div
      ref="content"
      :class="{ content: true, 'show-uploads': state.showUploads }"
    >
      <div class="container">
        <div v-if="reqFiles.state.isLoading" class="content-text">
          Loading...
        </div>
        <div
          v-if="!reqFiles.state.isLoading && reqFiles.state.error"
          class="content-text"
        >
          {{ reqFiles.state.error.message }}
        </div>
        <template v-else-if="reqFiles.state.data">
          <div v-if="reqFiles.state.data.length === 0" class="content-text">
            Directory is empty.
          </div>
          <ul v-else class="item-container">
            <ListItem
              checkbox
              input-id="select-all"
              class="item-select-all"
              :checked="isSelectedAll"
              :disabled="
                !config.operations.download || reqFiles.state.isLoading
              "
              @check="selectAll"
            >
              <template #title>
                Select All ({{
                  (paths.length > 0 ? paths.length + '/' : '') +
                  reqFiles.state.data.length
                }})
              </template>
            </ListItem>
            <ListItem
              v-for="item of reqFiles.state.data"
              checkbox
              :key="item.path"
              :input-id="`item-box-${item.path}`"
              :checked="isSelectedAll"
              :disabled="
                !config.operations.download || reqFiles.state.isLoading
              "
              @check="() => handleCheck(item)"
            >
              <template #icon v-if="item.kind === 'directory'">
                &#128193;
              </template>
              <template #title>{{ item.name }}</template>
              <template #subtitle1 v-if="item.stats.mtime">
                {{ createDate(new Date(item.stats.mtime)) }}
              </template>
              <template #subtitle2 v-if="item.hSize !== null">
                {{ item.hSize }}
              </template>
              <template #action>
                <component
                  v-if="item.kind === 'directory'"
                  :to="{ query: { path: item.path } }"
                  :is="reqFiles.state.isLoading ? 'span' : 'router-link'"
                >
                  Open
                </component>
                <a
                  v-else-if="config.operations.download"
                  :href="getViewApiPath(item)"
                  target="_blank"
                >
                  View
                </a>
              </template>
            </ListItem>
          </ul>
        </template>
      </div>
    </div>

    <div
      :class="{
        actions: true,
        container: true,
        'show-uploads': state.showUploads
      }"
    >
      <div class="actions-container">
        <input hidden multiple type="file" ref="input" @change="upload" />
        <button
          type="button"
          :disabled="
            reqFiles.state.isLoading ||
            !!reqFiles.state.error ||
            !config.operations.upload
          "
          @click="handleUpload"
        >
          Upload
        </button>
        <button
          v-if="uploader.items.length > 0"
          type="button"
          @click="state.showUploads = !state.showUploads"
        >
          {{ state.showUploads ? 'Hide' : 'Show' }} Uploads
        </button>
        <button
          v-if="config.operations.download"
          type="button"
          :disabled="paths.length === 0"
          @click="download"
        >
          Download
        </button>
        <button
          type="button"
          :disabled="reqFiles.state.isLoading"
          @click="fetchFiles"
        >
          Refresh
        </button>
      </div>
      <UploadList
        v-show="state.showUploads"
        :items="uploader.items"
        @remove="removeUploadItem"
        @retry="retryUploadItem"
        @cancel="item => uploader.cancel(item.file)"
      />
    </div>
  </main>
</template>

<style scoped>
header {
  padding: 8px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid var(--color-border);
  .up {
    margin-right: 8px;
  }
  h3 {
    direction: rtl;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

main {
  display: flex;
  width: 100%;
  height: 100%;
  flex-direction: column;
}

.content,
.actions {
  transition: flex 200ms cubic-bezier(0.075, 0.82, 0.165, 1);
}

.content {
  flex: 1;
  overflow-y: auto;
  &.show-uploads {
    flex: 0;
  }
  .content-text {
    padding: 8px;
  }
}

.item-container {
  list-style-type: none;
  padding-left: 0;
  .item-select-all {
    position: sticky;
    top: 0;
    z-index: 1;
    background-color: var(--color-background);
    label {
      display: inline;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
}

.actions {
  padding: 12px;
  border-top: 1px solid var(--color-border);
  &.show-uploads {
    flex: 1;
    overflow-y: auto;
    border-top: none;
  }
}

.actions-container {
  display: flex;
  column-gap: 8px;
  flex-wrap: wrap;
}
</style>
