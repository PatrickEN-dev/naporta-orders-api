import { Inject, Injectable } from '@nestjs/common';
import { NotFoundError } from '../../../../shared/errors/domain.error';
import type { Order } from '../../domain/entities/order.entity';
import { ORDER_REPOSITORY, type OrderRepository } from '../../domain/repositories/order.repository';

@Injectable()
export class FindOrderUseCase {
  constructor(@Inject(ORDER_REPOSITORY) private readonly orders: OrderRepository) {}

  async execute(id: string): Promise<Order> {
    const order = await this.orders.findById(id);
    if (!order) throw new NotFoundError(`pedido ${id} não encontrado`);
    return order;
  }
}
