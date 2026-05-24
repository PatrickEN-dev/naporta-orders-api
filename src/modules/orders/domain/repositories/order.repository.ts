import type { Order } from '../entities/order.entity';
import type { OrderStatusValue } from '../value-objects/order-status.vo';

export const ORDER_REPOSITORY = Symbol('ORDER_REPOSITORY');

export interface OrderFilters {
  number?: string;
  status?: OrderStatusValue;
  startDate?: Date;
  endDate?: Date;
}

export interface ListOrdersOptions {
  filters: OrderFilters;
  page: number;
  limit: number;
  sort: { field: 'createdAt' | 'deliveryForecastAt'; direction: 'asc' | 'desc' };
}

export interface PaginatedOrders {
  items: Order[];
  total: number;
}

export interface OrderRepository {
  findById(id: string): Promise<Order | null>;
  list(options: ListOrdersOptions): Promise<PaginatedOrders>;
  save(order: Order): Promise<void>;
  nextSequence(): Promise<number>;
}
