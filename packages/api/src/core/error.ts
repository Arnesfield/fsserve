export class FsError extends Error {
  constructor(readonly statusCode: number, message?: string) {
    super(message);
    this.name = 'FsError';
    Error.captureStackTrace?.(this, FsError);
  }
}
