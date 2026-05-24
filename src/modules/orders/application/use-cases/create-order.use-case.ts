import { Inject, Injectable } from '@nestjs/common';
import { UuidService } from '../../../../shared/services/uuid.service';
import { Order } from '../../domain/entities/order.entity';
import { ORDER_REPOSITORY, type OrderRepository } from '../../domain/repositories/order.repository';
import { Address } from '../../domain/value-objects/address.vo';
import { Document } from '../../domain/value-objects/document.vo';
import { OrderNumber } from '../../domain/value-objects/order-number.vo';
import type { CreateOrderInput } from '../dtos/create-order.input';
import { buildOrderItems } from '../helpers/build-order-items';

@Injectable()
export class CreateOrderUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly orders: OrderRepository,
    private readonly uuid: UuidService,
  ) {}

  async execute(input: CreateOrderInput): Promise<Order> {
    const sequence = await this.orders.nextSequence();
    const number = OrderNumber.format(new Date().getFullYear(), sequence);

    const order = Order.create({
      id: this.uuid.generate(),
      number,
      customerName: input.customerName,
      customerDocument: Document.create(input.customerDocument),
      deliveryAddress: Address.create(input.deliveryAddress),
      deliveryForecastAt: input.deliveryForecastAt,
      items: buildOrderItems(this.uuid, input.items),
      actorId: input.actorId,
    });

    await this.orders.save(order);
    return order;
  }
}
