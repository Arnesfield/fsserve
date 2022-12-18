export class FsError extends Error {
  constructor(
    readonly statusCode: number,
    message?: string,
    readonly path?: string
  ) {
    super(message);
    this.name = 'FsError';
    Error.captureStackTrace?.(this, FsError);
  }
}
