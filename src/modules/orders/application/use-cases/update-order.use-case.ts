import { Inject, Injectable } from '@nestjs/common';
import { NotFoundError } from '../../../../shared/errors/domain.error';
import { UuidService } from '../../../../shared/services/uuid.service';
import type { Order } from '../../domain/entities/order.entity';
import { ORDER_REPOSITORY, type OrderRepository } from '../../domain/repositories/order.repository';
import { Address } from '../../domain/value-objects/address.vo';
import type { UpdateOrderInput } from '../dtos/update-order.input';
import { buildOrderItems } from '../helpers/build-order-items';

@Injectable()
export class UpdateOrderUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly orders: OrderRepository,
    private readonly uuid: UuidService,
  ) {}

  async execute(input: UpdateOrderInput): Promise<Order> {
    const order = await this.orders.findById(input.orderId);
    if (!order) throw new NotFoundError(`pedido ${input.orderId} não encontrado`);

    if (input.deliveryAddress) {
      order.changeDeliveryAddress(Address.create(input.deliveryAddress));
    }
    if (input.deliveryForecastAt) {
      order.rescheduleDelivery(input.deliveryForecastAt);
    }
    if (input.items) {
      order.replaceItems(buildOrderItems(this.uuid, input.items));
    }
    if (input.status) {
      order.changeStatus(input.status, input.actorId, input.statusNote);
    }

    await this.orders.save(order);
    return order;
  }
}
