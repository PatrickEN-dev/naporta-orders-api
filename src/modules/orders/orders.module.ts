import { Module } from '@nestjs/common';
import { UuidService } from '../../shared/services/uuid.service';
import { CreateOrderUseCase } from './application/use-cases/create-order.use-case';
import { FindOrderUseCase } from './application/use-cases/find-order.use-case';
import { ListOrdersUseCase } from './application/use-cases/list-orders.use-case';
import { SoftDeleteOrderUseCase } from './application/use-cases/soft-delete-order.use-case';
import { UpdateOrderUseCase } from './application/use-cases/update-order.use-case';
import { ORDER_REPOSITORY } from './domain/repositories/order.repository';
import { OrdersController } from './infra/http/orders.controller';
import { PrismaOrderRepository } from './infra/persistence/prisma-order.repository';

@Module({
  controllers: [OrdersController],
  providers: [
    UuidService,
    CreateOrderUseCase,
    ListOrdersUseCase,
    FindOrderUseCase,
    UpdateOrderUseCase,
    SoftDeleteOrderUseCase,
    { provide: ORDER_REPOSITORY, useClass: PrismaOrderRepository },
  ],
})
export class OrdersModule {}
