<script setup lang="ts">
import qs from 'qs';
import { computed, reactive, ref, watch } from 'vue';
import { useRoute, type RouteLocationRaw } from 'vue-router';
import { api } from '../api/api';
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
        <div v-else-if="reqFiles.state.error" class="content-text error">
          {{ reqFiles.state.error.message }}
        </div>
        <template v-if="reqFiles.state.data">
          <div v-if="reqFiles.state.data.length === 0" class="content-text">
            Directory is empty.
          </div>
          <ul v-else class="item-container">
            <li class="item-select-all">
              <input
                id="all"
                type="checkbox"
                class="checkbox"
                :checked="isSelectedAll"
                :disabled="
                  !config.operations.download || reqFiles.state.isLoading
                "
                @change="selectAll"
              />
              <label for="all">
                Select All ({{
                  (paths.length > 0 ? paths.length + '/' : '') +
                  reqFiles.state.data.length
                }})
              </label>
            </li>
            <li v-for="item of reqFiles.state.data" :key="item.path">
              <input
                type="checkbox"
                class="checkbox"
                :id="`item-path-${item.path}`"
                :disabled="
                  !config.operations.download || reqFiles.state.isLoading
                "
                :checked="paths.includes(item.path)"
                @change="() => handleCheck(item)"
              />
              <label :for="`item-path-${item.path}`">
                <span v-if="item.kind === 'directory'" class="item-icon">
                  &#128193;
                </span>
                <span class="item-title">
                  <div>{{ item.name }}</div>
                  <div class="item-subtitle">
                    <span v-if="item.stats.mtime" class="item-modified">
                      {{ createDate(new Date(item.stats.mtime)) }}
                    </span>
                    <span v-if="item.hSize !== null" class="item-size">
                      {{ item.hSize }}
                    </span>
                  </div>
                </span>
              </label>
              <component
                v-if="item.kind === 'directory'"
                :to="{ query: { path: item.path } }"
                :is="reqFiles.state.isLoading ? 'span' : 'router-link'"
                class="item-action"
              >
                Open
              </component>
              <a
                v-else-if="config.operations.download"
                :href="getViewApiPath(item)"
                target="_blank"
                class="item-action"
              >
                View
              </a>
            </li>
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
  li {
    display: flex;
    padding: 2px 8px;
    column-gap: 8px;
    &:nth-child(even) {
      background-color: var(--color-background-mute);
    }
    label {
      flex: 1;
      display: flex;
      overflow: hidden;
      column-gap: 8px;
    }
    .item-icon {
      filter: grayscale(1);
      text-shadow: 0 0 0 var(--color-text);
    }
    .item-title {
      flex: 1;
      overflow: hidden;
      word-wrap: break-word;
    }
    .item-subtitle {
      display: flex;
      column-gap: 4px;
      color: var(--color-text);
      font-size: 0.8em;
      .item-modified {
        flex: 1;
      }
    }
    .item-icon,
    .item-action {
      margin-top: auto;
      margin-bottom: auto;
    }
  }

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
