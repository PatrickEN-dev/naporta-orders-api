import { ValidationError } from '../../../../shared/errors/domain.error';

const ORDER_NUMBER_PATTERN = /^ORD-\d{4}-\d{6}$/;

export class OrderNumber {
  private constructor(readonly value: string) {}

  static create(value: string): OrderNumber {
    if (!ORDER_NUMBER_PATTERN.test(value)) {
      throw new ValidationError('Order number must match ORD-YYYY-NNNNNN');
    }
    return new OrderNumber(value);
  }

  static format(year: number, sequence: number): OrderNumber {
    return new OrderNumber(`ORD-${year}-${String(sequence).padStart(6, '0')}`);
  }
}
