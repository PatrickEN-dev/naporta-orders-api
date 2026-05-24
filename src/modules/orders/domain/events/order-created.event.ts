import type { DomainEvent } from '../../../../shared/domain/domain-event';
import type { OrderStatusValue } from '../value-objects/order-status.vo';

export class OrderCreatedEvent implements DomainEvent {
  readonly name = 'order.created';
  readonly occurredAt = new Date();

  constructor(
    readonly orderId: string,
    readonly status: OrderStatusValue,
    readonly actorId: string | null,
  ) {}
}
