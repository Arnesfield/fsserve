import { HTTPError } from 'ky';
import { onUnmounted, reactive } from 'vue';

export interface FetchError<Metadata extends Record<string, any> = never> {
  statusCode: number;
  error: string;
  message: string;
  metadata?: Metadata;
}

export async function fetch<
  T,
  ErrorMetadata extends Record<string, any> = never
>(
  handler: () => T | Promise<T>
): Promise<[FetchError<ErrorMetadata> | null, T | null]> {
  try {
    return [null, await handler()];
  } catch (err) {
    // ignore other cases?
    const fetchError: FetchError<ErrorMetadata> | null =
      err instanceof HTTPError
        ? await err.response.json()
        : err instanceof Error && err.name !== 'AbortError'
        ? { statusCode: 500, error: err.name, message: err.message }
        : null;
    return [fetchError, null];
  }
}

export interface FetchState<T, ErrorMetadata extends Record<string, any>> {
  data?: T;
  error?: FetchError<ErrorMetadata>;
  isLoading: boolean;
}

export type FetchHandler<T> = (signal: AbortSignal) => T | Promise<T>;

export interface FetchOptions<T> {
  multiple?: boolean;
  handler?: FetchHandler<T>;
}

export interface UseFetch<
  T,
  ErrorMetadata extends Record<string, any> = never
> {
  state: FetchState<T, ErrorMetadata>;

  fetch(
    handler?: FetchHandler<T>
  ): Promise<[FetchError<ErrorMetadata> | null, T | null]>;

  fetch<T2 extends T = T, ErrorMetadata2 extends ErrorMetadata = ErrorMetadata>(
    handler?: FetchHandler<T2>
  ): Promise<[FetchError<ErrorMetadata2> | null, T2 | null]>;

  abort(): void;
}

export function useFetch<
  T,
  ErrorMetadata extends Record<string, any> = never
>(): UseFetch<T, ErrorMetadata>;

export function useFetch<T, ErrorMetadata extends Record<string, any> = never>(
  options: FetchOptions<T>
): UseFetch<T, ErrorMetadata>;

export function useFetch<T, ErrorMetadata extends Record<string, any> = never>(
  handler: FetchHandler<T>
): UseFetch<T, ErrorMetadata>;

export function useFetch<T, ErrorMetadata extends Record<string, any> = never>(
  handlerOrOptions?: FetchHandler<T> | FetchOptions<T>
): UseFetch<T, ErrorMetadata> {
  const options =
    typeof handlerOrOptions === 'function'
      ? { handler: handlerOrOptions }
      : typeof handlerOrOptions === 'object' && handlerOrOptions !== null
      ? handlerOrOptions
      : {};
  const { multiple } = options;
  const controllers = reactive<AbortController[]>([]);
  const state = reactive<FetchState<T, ErrorMetadata>>({
    isLoading: false
  }) as FetchState<T, ErrorMetadata>;

  function abort() {
    for (const controller of controllers.splice(0, controllers.length)) {
      controller.abort();
    }
  }

  async function fetchFn<
    T2 extends T = T,
    ErrorMetadata2 extends ErrorMetadata = ErrorMetadata
  >(
    handler: FetchHandler<T2> = options.handler as FetchHandler<T2>
  ): Promise<[FetchError<ErrorMetadata2> | null, T2 | null]> {
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
    const result = await fetch<T2, ErrorMetadata2>(() => {
      return handler(controller.signal);
    });
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
      state.data = data;
    }
    return result;
  }

  onUnmounted(() => abort());

  return { state, fetch: fetchFn, abort };
}
