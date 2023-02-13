<script setup lang="ts">
import saveAs from 'file-saver';
import qs from 'qs';
import { computed, reactive, ref, watch } from 'vue';
import { useRoute, type RouteLocationRaw } from 'vue-router';
import { api } from '../api/api';
import { config } from '../api/config';
import UploadList from '../components/UploadList.vue';
import type { FsFile, FsObject } from '../types/core.types';
import { useFetch } from '../utils/fetch';
import { useUploader, type UploadItem } from '../utils/uploader';

// TODO: separate components?

const route = useRoute();
const path = computed(() => {
  const qp = route.query.path;
  return Array.isArray(qp) ? qp[0] : typeof qp === 'string' ? qp : null;
});
const input = ref<HTMLInputElement>();
const paths = reactive<string[]>([]);
const state = reactive({ showUploads: false });

const uploader = useUploader('files');
const reqFiles = useFetch(signal => {
  const params = qs.stringify({ path: path.value });
  return api.get('files', { signal, searchParams: params }).json<FsObject[]>();
});
const reqDownload = useFetch({
  multiple: true,
  handler(signal) {
    const params = qs.stringify({ paths }, { arrayFormat: 'repeat' });
    return api.get('files/download', { signal, searchParams: params }).blob();
  }
});

const files = computed(() => {
  const items = reqFiles.state.data || [];
  return items.filter((item): item is FsFile => item.kind === 'file');
});
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

async function download() {
  const [, blob] = await reqDownload.fetch();
  // TODO: file name
  if (blob) saveAs(blob);
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
    uploader.upload(file, path.value);
  }
  // clear input field
  if (input.value) {
    input.value.value = '';
  }
}

function getViewApiPath(item: FsFile) {
  const params = new URLSearchParams({ path: item.path }).toString();
  return `${config.baseUrl}/files/view?${params}`;
}

function handleCheck(item: FsObject) {
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
</script>

<template>
  <main>
    <header>
      <component
        class="up"
        :to="parentPath"
        :is="disableUp ? 'span' : 'router-link'"
      >
        <button type="button" :disabled="disableUp">Up</button>
      </component>
      <h3>Files</h3>
    </header>
    <div :class="{ content: true, 'show-uploads': state.showUploads }">
      <div v-if="reqFiles.state.isLoading">Loading...</div>
      <template v-if="reqFiles.state.data && reqFiles.state.data.length > 0">
        <div>
          <input
            id="all"
            type="checkbox"
            class="checkbox"
            :checked="isSelectedAll"
            :disabled="reqFiles.state.isLoading"
            @change="selectAll"
          />
          <label for="all">Select All</label>
        </div>
        <ul>
          <li v-for="item of reqFiles.state.data" :key="item.path">
            <div class="item-content">
              <input
                type="checkbox"
                class="checkbox"
                :id="`item-${item.path}`"
                :disabled="
                  reqFiles.state.isLoading || item.kind === 'directory'
                "
                :checked="paths.includes(item.path)"
                @change="() => handleCheck(item)"
              />
              <div v-if="item.kind === 'directory'">
                <component
                  :to="{ query: { path: item.path } }"
                  :is="reqFiles.state.isLoading ? 'span' : 'router-link'"
                >
                  {{ item.name }}
                </component>
              </div>
              <div v-else>
                <label :for="`item-${item.path}`">{{ item.name }}</label>
                &nbsp;<a :href="getViewApiPath(item)" target="_blank">View</a>
              </div>
            </div>
          </li>
        </ul>
      </template>
    </div>

    <div :class="{ actions: true, 'show-uploads': state.showUploads }">
      <div class="actions-container">
        <input hidden multiple type="file" ref="input" @change="upload" />
        <button type="button" @click="handleUpload">Upload</button>
        <button
          v-if="uploader.items.length > 0"
          type="button"
          @click="state.showUploads = !state.showUploads"
        >
          {{ state.showUploads ? 'Hide' : 'Show' }} Uploads
        </button>
        <button
          type="button"
          :disabled="paths.length === 0 || reqDownload.state.isLoading"
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
      />
    </div>
  </main>
</template>

<style scoped>
header {
  padding: 8px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid black;
}

header .up {
  margin-right: 8px;
}

main {
  display: flex;
  width: 100%;
  height: 100%;
  flex-direction: column;
}

.content {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.content.show-uploads {
  flex: 0;
}

.item-content {
  display: flex;
}

.checkbox {
  margin-right: 8px;
}

.actions {
  padding: 12px;
  border-top: 1px solid black;
}

.content,
.actions {
  transition: flex 200ms cubic-bezier(0.075, 0.82, 0.165, 1);
}

.actions.show-uploads {
  flex: 1;
  overflow-y: auto;
}

.actions-container > *:not(:last-child) {
  margin-right: 8px;
}
</style>
