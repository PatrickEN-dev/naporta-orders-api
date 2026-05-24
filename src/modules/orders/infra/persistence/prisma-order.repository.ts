import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../infra/prisma/prisma.service';
import type { Order } from '../../domain/entities/order.entity';
import { OrderCreatedEvent } from '../../domain/events/order-created.event';
import { OrderStatusChangedEvent } from '../../domain/events/order-status-changed.event';
import type {
  ListOrdersOptions,
  OrderRepository,
  PaginatedOrders,
} from '../../domain/repositories/order.repository';
import { OrderMapper } from './order.mapper';

type Tx = Prisma.TransactionClient;

@Injectable()
export class PrismaOrderRepository implements OrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Order | null> {
    const raw = await this.prisma.db.order.findUnique({
      where: { id },
      include: { items: true },
    });
    return raw ? OrderMapper.toDomain(raw) : null;
  }

  async list(options: ListOrdersOptions): Promise<PaginatedOrders> {
    const where = this.buildWhere(options);
    const [rows, total] = await Promise.all([
      this.prisma.db.order.findMany({
        where,
        include: { items: true },
        orderBy: { [options.sort.field]: options.sort.direction },
        skip: (options.page - 1) * options.limit,
        take: options.limit,
      }),
      this.prisma.db.order.count({ where }),
    ]);
    return { items: rows.map((row) => OrderMapper.toDomain(row)), total };
  }

  async save(order: Order): Promise<void> {
    const events = order.pullEvents();
    await this.prisma.base.$transaction(async (tx) => {
      await this.upsertOrder(tx, order);
      for (const event of events) {
        await this.recordHistory(tx, event);
      }
    });
  }

  async nextSequence(): Promise<number> {
    const rows = await this.prisma.base.$queryRaw<Array<{ nextval: bigint }>>`
      SELECT nextval('order_number_seq') AS nextval
    `;
    return Number(rows[0]?.nextval ?? 0);
  }

  private async upsertOrder(tx: Tx, order: Order): Promise<void> {
    const address = order.deliveryAddress;
    const data = {
      number: order.number.value,
      customerName: order.customerName,
      customerDocument: order.customerDocument.value,
      deliveryZipCode: address.zipCode,
      deliveryStreet: address.street,
      deliveryNumber: address.number,
      deliveryComplement: address.complement,
      deliveryDistrict: address.district,
      deliveryCity: address.city,
      deliveryState: address.state,
      deliveryCountry: address.country,
      deliveryForecastAt: order.deliveryForecastAt,
      status: order.status,
      totalCents: order.total.cents,
      deletedAt: order.deletedAt,
    } satisfies Prisma.OrderUpdateInput;

    const itemsData = order.items.map((item) => ({
      id: item.id,
      description: item.description,
      priceCents: item.price.cents,
      quantity: item.quantity,
    }));

    await tx.order.upsert({
      where: { id: order.id },
      create: {
        id: order.id,
        ...data,
        createdAt: order.createdAt,
        items: { create: itemsData },
      },
      update: {
        ...data,
        items: { deleteMany: {}, create: itemsData },
      },
    });
  }

  private async recordHistory(
    tx: Tx,
    event: OrderCreatedEvent | OrderStatusChangedEvent | { name: string },
  ): Promise<void> {
    if (event instanceof OrderCreatedEvent) {
      await tx.orderStatusHistory.create({
        data: {
          orderId: event.orderId,
          fromStatus: null,
          toStatus: event.status,
          notes: null,
          changedById: event.actorId,
          changedAt: event.occurredAt,
        },
      });
      return;
    }
    if (event instanceof OrderStatusChangedEvent) {
      await tx.orderStatusHistory.create({
        data: {
          orderId: event.orderId,
          fromStatus: event.from,
          toStatus: event.to,
          notes: event.notes,
          changedById: event.actorId,
          changedAt: event.occurredAt,
        },
      });
    }
  }

  private buildWhere(options: ListOrdersOptions): Prisma.OrderWhereInput {
    const { filters } = options;
    const where: Prisma.OrderWhereInput = {};
    if (filters.number) where.number = filters.number;
    if (filters.status) where.status = filters.status;
    if (filters.startDate || filters.endDate) {
      where.createdAt = {
        ...(filters.startDate ? { gte: filters.startDate } : {}),
        ...(filters.endDate ? { lte: filters.endDate } : {}),
      };
    }
    return where;
  }
}
