import { InvalidStateError } from '../../../../shared/errors/domain.error';

export const ORDER_STATUSES = ['PENDING', 'IN_TRANSIT', 'DELIVERED', 'CANCELED'] as const;
export type OrderStatusValue = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_ENUM_MESSAGE = `status must be one of: ${ORDER_STATUSES.join(', ')}`;

const TRANSITIONS: Readonly<Record<OrderStatusValue, readonly OrderStatusValue[]>> = {
  PENDING: ['IN_TRANSIT', 'CANCELED'],
  IN_TRANSIT: ['DELIVERED', 'CANCELED'],
  DELIVERED: [],
  CANCELED: [],
};

export class OrderStatus {
  private constructor(readonly value: OrderStatusValue) {}

  static create(value: OrderStatusValue): OrderStatus {
    return new OrderStatus(value);
  }

  static pending(): OrderStatus {
    return new OrderStatus('PENDING');
  }

  transitionTo(next: OrderStatusValue): OrderStatus {
    const allowed = TRANSITIONS[this.value];
    if (!allowed.includes(next)) {
      throw new InvalidStateError(`Cannot transition from ${this.value} to ${next}`);
    }
    return new OrderStatus(next);
  }

  isTerminal(): boolean {
    return TRANSITIONS[this.value].length === 0;
  }
}
