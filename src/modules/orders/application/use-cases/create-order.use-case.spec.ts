import { UuidService } from '../../../../shared/services/uuid.service';
import { InMemoryOrderRepository } from '../../__tests__/in-memory-order.repository';
import { CreateOrderUseCase } from './create-order.use-case';

const VALID_CPF = '52998224725';

const ADDRESS = {
  zipCode: '01310100',
  street: 'Av. Paulista',
  number: '1578',
  district: 'Bela Vista',
  city: 'São Paulo',
  state: 'SP',
};

describe('CreateOrderUseCase', () => {
  let repository: InMemoryOrderRepository;
  let useCase: CreateOrderUseCase;

  beforeEach(() => {
    repository = new InMemoryOrderRepository();
    useCase = new CreateOrderUseCase(repository, new UuidService());
  });

  it('creates an order with a sequential number', async () => {
    const order = await useCase.execute({
      customerName: 'Mariana Silva',
      customerDocument: VALID_CPF,
      deliveryAddress: ADDRESS,
      deliveryForecastAt: new Date(Date.now() + 7 * 86_400_000),
      items: [{ description: 'Camiseta', priceCents: 4990 }],
      actorId: 'user-1',
    });

    expect(order.number.value).toMatch(/^ORD-\d{4}-000001$/);
    expect(order.status).toBe('PENDING');
    expect(repository.items.size).toBe(1);
  });

  it('rejects forecast in the past', async () => {
    await expect(
      useCase.execute({
        customerName: 'Buyer',
        customerDocument: VALID_CPF,
        deliveryAddress: ADDRESS,
        deliveryForecastAt: new Date(Date.now() - 1000),
        items: [{ description: 'X', priceCents: 1000 }],
        actorId: null,
      }),
    ).rejects.toThrow('deliveryForecastAt must be in the future');
  });
});
