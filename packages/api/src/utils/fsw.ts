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
    throw new FsError(403, 'Cannot access beyond current working directory.');
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
    throw isNotFound ? new FsError(404, 'File or directory not found.') : error;
  }
}

export async function statCheck(
  kind: FsObject['kind'],
  value: string
): Promise<fs.Stats> {
  const stats = await stat(value);
  if ((kind === 'file') === stats.isDirectory()) {
    throw new FsError(400, `Not a ${kind}.`);
  }
  return stats;
}

export async function unlink(value: string): Promise<boolean> {
  try {
    await statCheck('file', value);
    await fs.promises.unlink(value);
    return true;
  } catch {
    return false;
  }
}

export async function getWritePath(value: string): Promise<string> {
  let target = value;
  for (let increment = 0; true; increment++) {
    if (increment > 0) {
      const ext = path.extname(value);
      const n = increment ? `-${increment}` : '';
      const name = path.basename(value, ext) + n + ext;
      target = absolute(path.dirname(value), name);
    }
    try {
      await fs.promises.stat(target);
    } catch {
      break;
    }
  }
  return target;
}
