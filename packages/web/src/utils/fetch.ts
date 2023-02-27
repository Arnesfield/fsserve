import { HTTPError } from 'ky';
import {
  onUnmounted,
  reactive,
  type UnwrapNestedRefs,
  type UnwrapRef
} from 'vue';

export interface FetchError {
  statusCode: number;
  error: string;
  message: string;
}

export async function fetch<T>(
  handler: () => T | Promise<T>
): Promise<[FetchError | null, T | null]> {
  try {
    return [null, await handler()];
  } catch (err) {
    // ignore other cases?
    const fetchError: FetchError | null =
      err instanceof HTTPError
        ? await err.response.json()
        : err instanceof Error && err.name !== 'AbortError'
        ? { statusCode: 500, error: err.name, message: err.message }
        : null;
    return [fetchError, null];
  }
}

export interface FetchState<T> {
  data?: T;
  error?: FetchError;
  isLoading: boolean;
}

export type FetchHandler<T> = (signal: AbortSignal) => T | Promise<T>;

export interface FetchOptions<T> {
  multiple?: boolean;
  handler?: FetchHandler<T>;
}

export interface UseFetch<T> {
  state: UnwrapNestedRefs<FetchState<T>>;
  fetch(handler?: FetchHandler<T>): Promise<[FetchError | null, T | null]>;
  abort(): void;
}

export function useFetch<T>(): UseFetch<T>;
export function useFetch<T>(options: FetchOptions<T>): UseFetch<T>;
export function useFetch<T>(handler: FetchHandler<T>): UseFetch<T>;

export function useFetch<T>(
  handlerOrOptions?: FetchHandler<T> | FetchOptions<T>
): UseFetch<T> {
  const options =
    typeof handlerOrOptions === 'function'
      ? { handler: handlerOrOptions }
      : typeof handlerOrOptions === 'object' && handlerOrOptions !== null
      ? handlerOrOptions
      : {};
  const { multiple } = options;
  const controllers = reactive<AbortController[]>([]);
  const state = reactive<FetchState<T>>({ isLoading: false });

  function abort() {
    for (const controller of controllers.splice(0, controllers.length)) {
      controller.abort();
    }
  }

  async function fetchFn(handler = options.handler) {
    if (!handler) {
      throw new Error('Missing fetch handler.');
    }
    // abort previous requests
    if (!multiple) {
      abort();
    }
    const controller = new AbortController();
    controllers.push(controller);
    state.isLoading = true;
    const result = await fetch(() => handler(controller.signal));
    const [error, data] = result;
    const index = controllers.indexOf(controller);
    if (index > -1) {
      controllers.splice(index, 1);
    }
    if (!multiple || controllers.length === 0) {
      state.isLoading = false;
    }
    // skip setting state
    if (multiple) {
      return result;
    }
    state.error = error || undefined;
    if (data !== null) {
      state.data = data as UnwrapRef<T>;
    }
    return result;
  }

  onUnmounted(() => abort());

  return { state, fetch: fetchFn, abort };
}
