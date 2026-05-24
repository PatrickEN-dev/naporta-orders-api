import type { Order } from '../domain/entities/order.entity';
import type {
  ListOrdersOptions,
  OrderRepository,
  PaginatedOrders,
} from '../domain/repositories/order.repository';

export class InMemoryOrderRepository implements OrderRepository {
  readonly items = new Map<string, Order>();
  private sequence = 0;

  findById(id: string): Promise<Order | null> {
    const order = this.items.get(id);
    return Promise.resolve(order && !order.isDeleted ? order : null);
  }

  list(options: ListOrdersOptions): Promise<PaginatedOrders> {
    const filtered = [...this.items.values()].filter((order) => {
      if (order.isDeleted) return false;
      if (options.filters.number && order.number.value !== options.filters.number) return false;
      if (options.filters.status && order.status !== options.filters.status) return false;
      if (options.filters.startDate && order.createdAt < options.filters.startDate) return false;
      if (options.filters.endDate && order.createdAt > options.filters.endDate) return false;
      return true;
    });

    const sorted = [...filtered].sort((a, b) => {
      const aValue = options.sort.field === 'createdAt' ? a.createdAt : a.deliveryForecastAt;
      const bValue = options.sort.field === 'createdAt' ? b.createdAt : b.deliveryForecastAt;
      const cmp = aValue.getTime() - bValue.getTime();
      return options.sort.direction === 'asc' ? cmp : -cmp;
    });

    const total = sorted.length;
    const start = (options.page - 1) * options.limit;
    return Promise.resolve({ items: sorted.slice(start, start + options.limit), total });
  }

  save(order: Order): Promise<void> {
    order.pullEvents();
    this.items.set(order.id, order);
    return Promise.resolve();
  }

  nextSequence(): Promise<number> {
    this.sequence += 1;
    return Promise.resolve(this.sequence);
  }
}
