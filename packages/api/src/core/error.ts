export class FsError extends Error {
  readonly values: string[];
  constructor(
    readonly statusCode: number,
    message?: string,
    ...values: string[]
  ) {
    super(message);
    this.name = 'FsError';
    this.values = values;
    Error.captureStackTrace?.(this, FsError);
  }
}
