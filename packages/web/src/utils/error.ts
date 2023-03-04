import type { FetchError } from './fetch';

export function createError<Metadata = unknown>(
  error: Omit<FetchError<Metadata>, 'getMetadata'> | null
): FetchError<Metadata> | null {
  // NOTE: would be better to check via custom `code` instead of `stateCode`
  return (
    error && {
      ...error,
      getMetadata<T = Metadata>(statusCode?: number) {
        return statusCode == null || statusCode === error.statusCode
          ? (error.metadata as T | undefined)
          : undefined;
      }
    }
  );
}
