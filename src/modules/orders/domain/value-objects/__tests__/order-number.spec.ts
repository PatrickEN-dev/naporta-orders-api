import { ValidationError } from '../../../../../shared/errors/domain.error';
import { OrderNumber } from '../order-number.vo';

describe('OrderNumber', () => {
  it('formats year and sequence with padding', () => {
    expect(OrderNumber.format(2026, 7).value).toBe('ORD-2026-000007');
  });

  it('accepts valid pattern', () => {
    expect(OrderNumber.create('ORD-2026-000123').value).toBe('ORD-2026-000123');
  });

  it('rejects invalid pattern', () => {
    expect(() => OrderNumber.create('123-2026-ABC')).toThrow(ValidationError);
  });
});
