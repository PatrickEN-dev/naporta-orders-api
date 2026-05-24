import { InvalidStateError } from '../../../../shared/errors/domain.error';
import { OrderStatus } from './order-status.vo';

describe('OrderStatus', () => {
  it('starts as PENDING', () => {
    expect(OrderStatus.pending().value).toBe('PENDING');
  });

  it('transitions PENDING → IN_TRANSIT', () => {
    expect(OrderStatus.pending().transitionTo('IN_TRANSIT').value).toBe('IN_TRANSIT');
  });

  it('transitions IN_TRANSIT → DELIVERED', () => {
    const status = OrderStatus.pending().transitionTo('IN_TRANSIT').transitionTo('DELIVERED');
    expect(status.value).toBe('DELIVERED');
    expect(status.isTerminal()).toBe(true);
  });

  it('allows cancel from PENDING and IN_TRANSIT', () => {
    expect(OrderStatus.pending().transitionTo('CANCELED').value).toBe('CANCELED');
    expect(OrderStatus.pending().transitionTo('IN_TRANSIT').transitionTo('CANCELED').value).toBe(
      'CANCELED',
    );
  });

  it('rejects transition from DELIVERED', () => {
    const delivered = OrderStatus.pending().transitionTo('IN_TRANSIT').transitionTo('DELIVERED');
    expect(() => delivered.transitionTo('PENDING')).toThrow(InvalidStateError);
  });

  it('rejects transition from CANCELED', () => {
    const canceled = OrderStatus.pending().transitionTo('CANCELED');
    expect(() => canceled.transitionTo('IN_TRANSIT')).toThrow(InvalidStateError);
  });
});
