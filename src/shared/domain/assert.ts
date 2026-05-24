import { ValidationError } from '../errors/domain.error';

export function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new ValidationError(message);
  }
}

export function assertPositiveInteger(value: number, message: string): void {
  assert(Number.isInteger(value) && value >= 1, message);
}

export function assertNonNegativeInteger(value: number, message: string): void {
  assert(Number.isInteger(value) && value >= 0, message);
}
