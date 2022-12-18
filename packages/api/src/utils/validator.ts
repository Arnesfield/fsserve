import createHttpError from 'http-errors';
import { FsServeOptions } from '../types/fsserve.types';
import { Operation } from '../types/operation.types';

export class Validator {
  constructor(protected readonly options: FsServeOptions) {}

  guard(...operations: Operation[]) {
    const allOperations = this.options.operations;
    const valid =
      !allOperations || operations.every(operation => allOperations[operation]);
    if (!valid) {
      return createHttpError(403, 'Not authorized to perform this action.');
    }
  }
}
