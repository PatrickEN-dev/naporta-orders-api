import { NotFoundError } from '../../../../../shared/errors/domain.error';
import { UuidService } from '../../../../../shared/services/uuid.service';
import { InMemoryOrderRepository } from '../../../__tests__/in-memory-order.repository';
import { CreateOrderUseCase } from '../create-order.use-case';
import { SoftDeleteOrderUseCase } from '../soft-delete-order.use-case';

const ADDRESS = {
  zipCode: '01310100',
  street: 'Av. Paulista',
  number: '1578',
  district: 'Bela Vista',
  city: 'São Paulo',
  state: 'SP',
};

describe('SoftDeleteOrderUseCase', () => {
  let repository: InMemoryOrderRepository;
  let create: CreateOrderUseCase;
  let softDelete: SoftDeleteOrderUseCase;

  beforeEach(() => {
    repository = new InMemoryOrderRepository();
    create = new CreateOrderUseCase(repository, new UuidService());
    softDelete = new SoftDeleteOrderUseCase(repository);
  });

  it('marks the order as deleted and removes from queries', async () => {
    const order = await create.execute({
      customerName: 'Buyer',
      customerDocument: '52998224725',
      deliveryAddress: ADDRESS,
      deliveryForecastAt: new Date(Date.now() + 7 * 86_400_000),
      items: [{ description: 'X', priceCents: 1000, quantity: 1 }],
      actorId: null,
    });

    await softDelete.execute(order.id);
    expect(await repository.findById(order.id)).toBeNull();
  });

  it('throws when order does not exist', async () => {
    await expect(softDelete.execute('missing')).rejects.toThrow(NotFoundError);
  });
});
