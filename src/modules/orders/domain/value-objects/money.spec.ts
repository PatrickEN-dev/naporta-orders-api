import { ValidationError } from '../../../../shared/errors/domain.error';
import { Money } from './money.vo';

describe('Money', () => {
  it('creates from cents', () => {
    const money = Money.fromCents(1500);
    expect(money.cents).toBe(1500);
  });

  it('rejects non-integer cents', () => {
    expect(() => Money.fromCents(10.5)).toThrow(ValidationError);
  });

  it('rejects negative cents', () => {
    expect(() => Money.fromCents(-1)).toThrow(ValidationError);
  });

  it('adds two Money values', () => {
    const total = Money.fromCents(1000).add(Money.fromCents(2599));
    expect(total.cents).toBe(3599);
  });

  it('formats as BRL', () => {
    expect(Money.fromCents(4990).toString()).toBe('R$ 49,90');
  });
});
