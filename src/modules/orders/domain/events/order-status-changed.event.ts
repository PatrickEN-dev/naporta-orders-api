import type { DomainEvent } from '../../../../shared/domain/domain-event';
import type { OrderStatusValue } from '../value-objects/order-status.vo';

export class OrderStatusChangedEvent implements DomainEvent {
  readonly name = 'order.status_changed';
  readonly occurredAt = new Date();

  constructor(
    readonly orderId: string,
    readonly from: OrderStatusValue,
    readonly to: OrderStatusValue,
    readonly actorId: string | null,
    readonly notes: string | null = null,
  ) {}
}
