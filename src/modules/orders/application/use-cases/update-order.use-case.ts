import { Inject, Injectable } from '@nestjs/common';
import { NotFoundError } from '../../../../shared/errors/domain.error';
import { UuidService } from '../../../../shared/services/uuid.service';
import type { Order } from '../../domain/entities/order.entity';
import { OrderItem } from '../../domain/entities/order-item.entity';
import { ORDER_REPOSITORY, type OrderRepository } from '../../domain/repositories/order.repository';
import { Address } from '../../domain/value-objects/address.vo';
import { Money } from '../../domain/value-objects/money.vo';
import type { UpdateOrderInput } from '../dtos/update-order.input';

@Injectable()
export class UpdateOrderUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly orders: OrderRepository,
    private readonly uuid: UuidService,
  ) {}

  async execute(input: UpdateOrderInput): Promise<Order> {
    const order = await this.orders.findById(input.orderId);
    if (!order) throw new NotFoundError(`Order ${input.orderId} not found`);

    if (input.deliveryAddress) {
      order.changeDeliveryAddress(Address.create(input.deliveryAddress));
    }
    if (input.deliveryForecastAt) {
      order.rescheduleDelivery(input.deliveryForecastAt);
    }
    if (input.items) {
      const items = input.items.map((item) =>
        OrderItem.create({
          id: this.uuid.generate(),
          description: item.description,
          price: Money.fromCents(item.priceCents),
          quantity: item.quantity,
        }),
      );
      order.replaceItems(items);
    }
    if (input.status) {
      order.changeStatus(input.status, input.actorId, input.statusNote);
    }

    await this.orders.save(order);
    return order;
  }
}
