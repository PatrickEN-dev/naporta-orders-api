import type { OrderStatusValue } from '../../domain/value-objects/order-status.vo';

export interface ListOrdersInput {
  number?: string;
  status?: OrderStatusValue;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
  sort?: string;
}
