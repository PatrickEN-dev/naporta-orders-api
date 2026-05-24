import { ApiProperty } from '@nestjs/swagger';
import type { Order } from '../../../domain/entities/order.entity';
import type { OrderStatusValue } from '../../../domain/value-objects/order-status.vo';

export class OrderItemResponse {
  @ApiProperty() id!: string;
  @ApiProperty() description!: string;
  @ApiProperty() priceCents!: number;
}

export class OrderAddressResponse {
  @ApiProperty() zipCode!: string;
  @ApiProperty() street!: string;
  @ApiProperty() number!: string;
  @ApiProperty({ nullable: true, required: false }) complement!: string | null;
  @ApiProperty() district!: string;
  @ApiProperty() city!: string;
  @ApiProperty() state!: string;
  @ApiProperty() country!: string;
}

export class OrderResponse {
  @ApiProperty() id!: string;
  @ApiProperty() number!: string;
  @ApiProperty() customerName!: string;
  @ApiProperty() customerDocument!: string;
  @ApiProperty({ type: OrderAddressResponse }) deliveryAddress!: OrderAddressResponse;
  @ApiProperty() deliveryForecastAt!: string;
  @ApiProperty() status!: OrderStatusValue;
  @ApiProperty({ type: [OrderItemResponse] }) items!: OrderItemResponse[];
  @ApiProperty() totalCents!: number;
  @ApiProperty() createdAt!: string;
  @ApiProperty() updatedAt!: string;
}

export class PaginationMeta {
  @ApiProperty() page!: number;
  @ApiProperty() limit!: number;
  @ApiProperty() total!: number;
  @ApiProperty() totalPages!: number;
}

export class PaginatedOrdersResponse {
  @ApiProperty({ type: [OrderResponse] }) data!: OrderResponse[];
  @ApiProperty({ type: PaginationMeta }) meta!: PaginationMeta;
}

export class OrderPresenter {
  static toResponse(order: Order): OrderResponse {
    const address = order.deliveryAddress;
    return {
      id: order.id,
      number: order.number.value,
      customerName: order.customerName,
      customerDocument: order.customerDocument.value,
      deliveryAddress: {
        zipCode: address.zipCode,
        street: address.street,
        number: address.number,
        complement: address.complement,
        district: address.district,
        city: address.city,
        state: address.state,
        country: address.country,
      },
      deliveryForecastAt: order.deliveryForecastAt.toISOString(),
      status: order.status,
      items: order.items.map((item) => ({
        id: item.id,
        description: item.description,
        priceCents: item.price.cents,
      })),
      totalCents: order.total.cents,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    };
  }

  static toPaginatedResponse(
    items: Order[],
    page: number,
    limit: number,
    total: number,
  ): PaginatedOrdersResponse {
    return {
      data: items.map((order) => OrderPresenter.toResponse(order)),
      meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    };
  }
}
