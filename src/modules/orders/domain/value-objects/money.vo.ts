import { ValidationError } from '../../../../shared/errors/domain.error';
import { ValueObject } from '../../../../shared/domain/value-object.base';

export class Money extends ValueObject<{ cents: number }> {
  private constructor(cents: number) {
    super({ cents });
  }

  static fromCents(cents: number): Money {
    if (!Number.isInteger(cents)) {
      throw new ValidationError('Money must be an integer number of cents');
    }
    if (cents < 0) {
      throw new ValidationError('Money cannot be negative');
    }
    return new Money(cents);
  }

  static zero(): Money {
    return new Money(0);
  }

  get cents(): number {
    return this.props.cents;
  }

  add(other: Money): Money {
    return new Money(this.props.cents + other.props.cents);
  }

  override toString(): string {
    const reais = (this.props.cents / 100).toFixed(2).replace('.', ',');
    return `R$ ${reais}`;
  }
}
