import type { UuidService } from '../../../../shared/services/uuid.service';
import { OrderItem } from '../../domain/entities/order-item.entity';
import { Money } from '../../domain/value-objects/money.vo';
import type { CreateOrderItemInput } from '../dtos/create-order.input';

export function buildOrderItems(uuid: UuidService, inputs: CreateOrderItemInput[]): OrderItem[] {
  return inputs.map((item) =>
    OrderItem.create({
      id: uuid.generate(),
      description: item.description,
      price: Money.fromCents(item.priceCents),
      quantity: item.quantity,
    }),
  );
}
