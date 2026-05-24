import { assert } from '../../../../shared/domain/assert';

const ORDER_NUMBER_PATTERN = /^ORD-\d{4}-\d{6}$/;

export class OrderNumber {
  private constructor(readonly value: string) {}

  static create(value: string): OrderNumber {
    assert(ORDER_NUMBER_PATTERN.test(value), 'Order number must match ORD-YYYY-NNNNNN');
    return new OrderNumber(value);
  }

  static format(year: number, sequence: number): OrderNumber {
    return new OrderNumber(`ORD-${year}-${String(sequence).padStart(6, '0')}`);
  }
}
