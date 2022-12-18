import { FsError } from '../core/error';
import { FsServeOptions } from '../types/fsserve.types';
import { Operation } from '../types/operation.types';

// TODO: remove validator
export class Validator {
  constructor(protected readonly options: FsServeOptions) {}

  guard(...operations: Operation[]): FsError | undefined {
    const allOperations = this.options.operations;
    const valid =
      !allOperations || operations.every(operation => allOperations[operation]);
    if (!valid) {
      return new FsError(403, 'Not authorized to perform this action.');
    }
  }
}
