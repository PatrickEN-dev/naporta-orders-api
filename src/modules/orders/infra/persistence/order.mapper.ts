import type { Order as PrismaOrder, OrderItem as PrismaOrderItem } from '@prisma/client';
import { Order } from '../../domain/entities/order.entity';
import { OrderItem } from '../../domain/entities/order-item.entity';
import { Address } from '../../domain/value-objects/address.vo';
import { Document } from '../../domain/value-objects/document.vo';
import { Money } from '../../domain/value-objects/money.vo';
import { OrderNumber } from '../../domain/value-objects/order-number.vo';
import { OrderStatus } from '../../domain/value-objects/order-status.vo';

type PrismaOrderWithItems = PrismaOrder & { items: PrismaOrderItem[] };

export class OrderMapper {
  static toDomain(raw: PrismaOrderWithItems): Order {
    const items = raw.items.map((item) =>
      OrderItem.create({
        id: item.id,
        description: item.description,
        price: Money.fromCents(item.priceCents),
      }),
    );

    return Order.restore({
      id: raw.id,
      number: OrderNumber.create(raw.number),
      customerName: raw.customerName,
      customerDocument: Document.create(raw.customerDocument),
      deliveryAddress: Address.create({
        zipCode: raw.deliveryZipCode,
        street: raw.deliveryStreet,
        number: raw.deliveryNumber,
        complement: raw.deliveryComplement,
        district: raw.deliveryDistrict,
        city: raw.deliveryCity,
        state: raw.deliveryState,
        country: raw.deliveryCountry,
      }),
      deliveryForecastAt: raw.deliveryForecastAt,
      status: OrderStatus.create(raw.status),
      items,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      deletedAt: raw.deletedAt,
    });
  }
}
