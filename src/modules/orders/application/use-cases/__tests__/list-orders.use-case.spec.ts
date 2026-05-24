import { ValidationError } from '../../../../../shared/errors/domain.error';
import { UuidService } from '../../../../../shared/services/uuid.service';
import { InMemoryOrderRepository } from '../../../__tests__/in-memory-order.repository';
import { CreateOrderUseCase } from '../create-order.use-case';
import { ListOrdersUseCase } from '../list-orders.use-case';

const ADDRESS = {
  zipCode: '01310100',
  street: 'Av. Paulista',
  number: '1578',
  district: 'Bela Vista',
  city: 'São Paulo',
  state: 'SP',
};

async function seedThreePendingOrders(create: CreateOrderUseCase): Promise<void> {
  for (let i = 0; i < 3; i++) {
    await create.execute({
      customerName: 'Buyer',
      customerDocument: '52998224725',
      deliveryAddress: ADDRESS,
      deliveryForecastAt: new Date(Date.now() + 7 * 86_400_000),
      items: [{ description: 'X', priceCents: 1000, quantity: 1 }],
      actorId: null,
    });
  }
}

describe('ListOrdersUseCase', () => {
  let repository: InMemoryOrderRepository;
  let create: CreateOrderUseCase;
  let list: ListOrdersUseCase;

  beforeEach(() => {
    repository = new InMemoryOrderRepository();
    create = new CreateOrderUseCase(repository, new UuidService());
    list = new ListOrdersUseCase(repository);
  });

  it('paginates with defaults', async () => {
    await seedThreePendingOrders(create);
    const result = await list.execute({});
    expect(result.total).toBe(3);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
    expect(result.items).toHaveLength(3);
  });

  it('respects page and limit', async () => {
    await seedThreePendingOrders(create);
    const result = await list.execute({ page: 2, limit: 2 });
    expect(result.items).toHaveLength(1);
  });

  it('parses descending sort', async () => {
    await seedThreePendingOrders(create);
    const result = await list.execute({ sort: '-createdAt' });
    expect(result.items[0].createdAt.getTime()).toBeGreaterThanOrEqual(
      result.items[1].createdAt.getTime(),
    );
  });

  it('rejects invalid sort field', async () => {
    await expect(list.execute({ sort: 'updatedAt' })).rejects.toThrow(ValidationError);
  });

  it('rejects startDate after endDate', async () => {
    await expect(
      list.execute({ startDate: new Date('2026-12-31'), endDate: new Date('2026-01-01') }),
    ).rejects.toThrow(ValidationError);
  });

  it('caps limit at 100', async () => {
    const result = await list.execute({ limit: 5000 });
    expect(result.limit).toBe(100);
  });
});
