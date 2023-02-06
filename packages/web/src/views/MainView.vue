<script setup lang="ts">
import saveAs from 'file-saver';
import qs from 'qs';
import { computed, reactive, watch } from 'vue';
import { useRoute, type RouteLocationRaw } from 'vue-router';
import { api, config } from '../api/api';
import type { FsFile, FsObject } from '../types/core.types';
import { useFetch } from '../utils/fetch';

// TODO: separate components?

const route = useRoute();
const path = computed(() => {
  const qp = route.query.path;
  return Array.isArray(qp) ? qp[0] : typeof qp === 'string' ? qp : null;
});
const paths = reactive<string[]>([]);

const reqFiles = useFetch(signal => {
  const params = qs.stringify({ path: path.value });
  return api.get('files', { signal, searchParams: params }).json<FsObject[]>();
});
const reqDownload = useFetch(signal => {
  const params = qs.stringify({ paths }, { arrayFormat: 'repeat' });
  return api.get('files/download', { signal, searchParams: params }).blob();
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
  if (blob) saveAs(blob);
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
    <div className="content">
      <div v-if="reqFiles.state.isLoading">Loading...</div>
      <template v-if="reqFiles.state.data && reqFiles.state.data.length > 0">
        <div>
          <input
            id="all"
            type="checkbox"
            className="checkbox"
            :checked="isSelectedAll"
            :disabled="reqFiles.state.isLoading"
            @change="selectAll"
          />
          <label for="all">Select All</label>
        </div>
        <ul>
          <li v-for="item of reqFiles.state.data" :key="item.path">
            <div className="item-content">
              <input
                type="checkbox"
                className="checkbox"
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

    <div class="actions">
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

.actions > *:not(:last-child) {
  margin-right: 8px;
}
</style>
