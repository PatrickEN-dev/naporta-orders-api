import { Inject, Injectable } from '@nestjs/common';
import { ValidationError } from '../../../../shared/errors/domain.error';
import {
  ORDER_REPOSITORY,
  type OrderRepository,
  type PaginatedOrders,
} from '../../domain/repositories/order.repository';
import type { ListOrdersInput } from '../dtos/list-orders.input';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const SORTABLE_FIELDS = new Set(['createdAt', 'deliveryForecastAt']);

export interface PaginatedOrdersResult extends PaginatedOrders {
  page: number;
  limit: number;
}

@Injectable()
export class ListOrdersUseCase {
  constructor(@Inject(ORDER_REPOSITORY) private readonly orders: OrderRepository) {}

  async execute(input: ListOrdersInput): Promise<PaginatedOrdersResult> {
    const page = input.page ?? DEFAULT_PAGE;
    const limit = Math.min(input.limit ?? DEFAULT_LIMIT, MAX_LIMIT);
    if (page < 1) throw new ValidationError('page deve ser maior ou igual a 1');
    if (limit < 1) throw new ValidationError('limit deve ser maior ou igual a 1');

    if (input.startDate && input.endDate && input.startDate > input.endDate) {
      throw new ValidationError('startDate deve ser anterior ou igual a endDate');
    }

    const sort = this.parseSort(input.sort);
    const result = await this.orders.list({
      filters: {
        number: input.number,
        status: input.status,
        startDate: input.startDate,
        endDate: input.endDate,
      },
      page,
      limit,
      sort,
    });

    return { ...result, page, limit };
  }

  private parseSort(raw?: string): {
    field: 'createdAt' | 'deliveryForecastAt';
    direction: 'asc' | 'desc';
  } {
    if (!raw) return { field: 'createdAt', direction: 'desc' };
    const direction = raw.startsWith('-') ? 'desc' : 'asc';
    const field = raw.replace(/^-/, '');
    if (!SORTABLE_FIELDS.has(field)) {
      throw new ValidationError(`sort deve ser um dos valores: ${[...SORTABLE_FIELDS].join(', ')}`);
    }
    return { field: field as 'createdAt' | 'deliveryForecastAt', direction };
  }
}
