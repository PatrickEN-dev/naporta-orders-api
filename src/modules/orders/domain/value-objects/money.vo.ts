import { assertNonNegativeInteger } from '../../../../shared/domain/assert';
import { ValueObject } from '../../../../shared/domain/value-object.base';

export class Money extends ValueObject<{ cents: number }> {
  private constructor(cents: number) {
    super({ cents });
  }

  static fromCents(cents: number): Money {
    assertNonNegativeInteger(cents, 'Money must be a non-negative integer number of cents');
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
