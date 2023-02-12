import { reactive } from 'vue';
import { config } from '../api/api';
import type { FetchError } from './fetch';

// TODO: maybe remove File from UploadItem?

export interface UploadItem {
  id: string;
  file: File;
  status: 'init' | 'uploading' | 'done' | 'error' | 'aborted';
  request?: XMLHttpRequest;
  progress: number;
  response?: any;
  error?: FetchError;
}

export interface UploaderOptions {
  url: string;
  method?: string;
}

export function useUploader(urlOrOptions: string | UploaderOptions) {
  const options =
    typeof urlOrOptions === 'string' ? { url: urlOrOptions } : urlOrOptions;
  const items = reactive<UploadItem[]>([]);

  function find(file: File) {
    const index = items.findIndex(item => item.file === file);
    const item = index > -1 ? items[index] : undefined;
    return { item, index };
  }

  function handleCancel(file: File) {
    const found = find(file);
    const { item } = found;
    if (item && !['done', 'error', 'aborted'].includes(item.status)) {
      item.request?.abort();
    }
    return found;
  }

  function cancel(file: File) {
    return handleCancel(file).item;
  }

  function remove(file: File) {
    const { item, index } = handleCancel(file);
    if (index > -1) {
      items.splice(index, 1);
    }
    return item;
  }

  function save(file: File, value: Partial<UploadItem>) {
    const index = items.findIndex(item => item.file === file);
    if (index > -1) {
      // this needs to happen?
      return (items[index] = { ...items[index], ...value });
    } else {
      // diy id for loop keys
      const item: UploadItem = {
        id: `file-${items.length}-${+new Date()}-${file.name}`,
        file,
        status: 'init',
        progress: 0,
        ...value
      };
      items.push(item);
      return item;
    }
  }

  function upload(file: File, path: string | null) {
    const request = new XMLHttpRequest();
    const item = save(file, { request });
    const result = new Promise<boolean>(resolve => {
      let status: 'done' | 'error' | 'aborted' = 'error';
      const done = () => {
        const { response } = request;
        const updates: Partial<UploadItem> = { status, response };
        if (status !== 'error') {
          updates.progress = status === 'done' ? 100 : 0;
        } else {
          updates.error = response || {
            statusCode: 500,
            error: 'Upload Error',
            message: 'An error occurred while uploading the file.'
          };
        }
        save(file, updates);
        resolve(status === 'done');
      };

      const handleErrorEvent = () => (status = 'error');
      const handleAbortEvent = () => (status = 'aborted');
      const handleLoadEvent = () => {
        status = request.status < 300 ? 'done' : 'error';
      };
      request.addEventListener('error', handleErrorEvent);
      request.upload.addEventListener('error', handleErrorEvent);
      request.addEventListener('timeout', handleErrorEvent);
      request.upload.addEventListener('timeout', handleErrorEvent);
      request.addEventListener('abort', handleAbortEvent);
      request.upload.addEventListener('abort', handleAbortEvent);
      request.addEventListener('load', handleLoadEvent);
      // note that for request errors, request.upload 'load' event is
      // also triggered just before request 'error' event is triggered
      request.upload.addEventListener('load', handleLoadEvent);
      request.addEventListener('loadend', done);
      request.upload.addEventListener('progress', event => {
        if (event.lengthComputable) {
          save(file, {
            status: 'uploading',
            progress: (event.loaded / event.total) * 100
          });
        }
      });
      request.responseType = 'json';
      request.open(
        options.method || 'POST',
        `${config.baseUrl}/${options.url}`
      );
      const formData = new FormData();
      path && formData.append('path', path);
      formData.append('file', file);
      request.send(formData);
    });
    return { item, result };
  }

  return { items, upload, cancel, remove };
}
