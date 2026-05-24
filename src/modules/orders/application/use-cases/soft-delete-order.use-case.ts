import { Inject, Injectable } from '@nestjs/common';
import { NotFoundError } from '../../../../shared/errors/domain.error';
import { ORDER_REPOSITORY, type OrderRepository } from '../../domain/repositories/order.repository';

@Injectable()
export class SoftDeleteOrderUseCase {
  constructor(@Inject(ORDER_REPOSITORY) private readonly orders: OrderRepository) {}

  async execute(id: string): Promise<void> {
    const order = await this.orders.findById(id);
    if (!order) throw new NotFoundError(`Order ${id} not found`);
    order.softDelete();
    await this.orders.save(order);
  }
}
