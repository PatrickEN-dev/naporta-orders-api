import { InvalidStateError, NotFoundError } from '../../../../shared/errors/domain.error';
import { UuidService } from '../../../../shared/services/uuid.service';
import { InMemoryOrderRepository } from '../../__tests__/in-memory-order.repository';
import { CreateOrderUseCase } from './create-order.use-case';
import { UpdateOrderUseCase } from './update-order.use-case';

const ADDRESS = {
  zipCode: '01310100',
  street: 'Av. Paulista',
  number: '1578',
  district: 'Bela Vista',
  city: 'São Paulo',
  state: 'SP',
};

async function buildPendingOrder(create: CreateOrderUseCase): Promise<{ id: string }> {
  const order = await create.execute({
    customerName: 'Buyer',
    customerDocument: '52998224725',
    deliveryAddress: ADDRESS,
    deliveryForecastAt: new Date(Date.now() + 7 * 86_400_000),
    items: [{ description: 'X', priceCents: 1000 }],
    actorId: null,
  });
  return { id: order.id };
}

describe('UpdateOrderUseCase', () => {
  let repository: InMemoryOrderRepository;
  let create: CreateOrderUseCase;
  let update: UpdateOrderUseCase;

  beforeEach(() => {
    repository = new InMemoryOrderRepository();
    const uuid = new UuidService();
    create = new CreateOrderUseCase(repository, uuid);
    update = new UpdateOrderUseCase(repository, uuid);
  });

  it('transitions status PENDING → IN_TRANSIT', async () => {
    const { id } = await buildPendingOrder(create);
    const result = await update.execute({ orderId: id, status: 'IN_TRANSIT', actorId: 'u-1' });
    expect(result.status).toBe('IN_TRANSIT');
  });

  it('rejects invalid transition', async () => {
    const { id } = await buildPendingOrder(create);
    await expect(
      update.execute({ orderId: id, status: 'DELIVERED', actorId: 'u-1' }),
    ).rejects.toThrow(InvalidStateError);
  });

  it('replaces items', async () => {
    const { id } = await buildPendingOrder(create);
    const result = await update.execute({
      orderId: id,
      items: [
        { description: 'A', priceCents: 1000 },
        { description: 'B', priceCents: 2000 },
      ],
      actorId: 'u-1',
    });
    expect(result.items).toHaveLength(2);
    expect(result.total.cents).toBe(3000);
  });

  it('throws on missing order', async () => {
    await expect(
      update.execute({ orderId: 'does-not-exist', status: 'IN_TRANSIT', actorId: null }),
    ).rejects.toThrow(NotFoundError);
  });
});
