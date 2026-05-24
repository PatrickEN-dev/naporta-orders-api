import type { OrderStatusValue } from '../../domain/value-objects/order-status.vo';
import type { CreateOrderAddressInput, CreateOrderItemInput } from './create-order.input';

export interface UpdateOrderInput {
  orderId: string;
  deliveryAddress?: CreateOrderAddressInput;
  deliveryForecastAt?: Date;
  status?: OrderStatusValue;
  statusNote?: string;
  items?: CreateOrderItemInput[];
  actorId: string | null;
}
