import fs from 'fs';
import path from 'path';
import { FsError } from '../core/error';
import { FsObject } from '../types/core.types';

// fs wrapped (fsw) with helpers and checks

export function absolute(
  from: string,
  value: string,
  ...paths: string[]
): string {
  const absolute = path.resolve(value, ...paths);
  if (!absolute.startsWith(from)) {
    throw new FsError(
      403,
      'Cannot access beyond current working directory.',
      absolute
    );
  }
  return absolute;
}

export function resolve(
  from: string,
  value: string,
  ...paths: string[]
): { absolute: string; relative: string } {
  const abs = absolute(from, value, ...paths);
  return { absolute: abs, relative: path.relative(from, abs) };
}

export async function stat(value: string): Promise<fs.Stats> {
  try {
    return await fs.promises.stat(value);
  } catch (error: unknown) {
    const isNotFound =
      error instanceof Error &&
      (error as NodeJS.ErrnoException).code === 'ENOENT';
    throw isNotFound
      ? new FsError(404, 'File or directory not found.', value)
      : error;
  }
}

export async function statCheck(
  kind: FsObject['file']['kind'],
  value: string
): Promise<fs.Stats> {
  const stats = await stat(value);
  if ((kind === 'file') === stats.isDirectory()) {
    throw new FsError(400, `Not a ${kind}.`, value);
  }
  return stats;
}
