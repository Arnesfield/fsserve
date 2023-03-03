import { STATUS_CODES } from 'http';

export interface FsErrorObject<Metadata extends Record<string, any>> {
  statusCode: number;
  error: string;
  message: string;
  metadata?: Metadata;
}

export class FsError<Metadata extends Record<string, any>> extends Error {
  constructor(
    readonly statusCode: number,
    message?: string,
    readonly metadata?: Metadata
  ) {
    super(message);
    this.name = 'FsError';
    Error.captureStackTrace?.(this, FsError);
  }

  toJSON(): FsErrorObject<Metadata> {
    return {
      statusCode: this.statusCode,
      error: STATUS_CODES[this.statusCode] || 'Error',
      message: this.message,
      metadata: this.metadata
    };
  }
}
