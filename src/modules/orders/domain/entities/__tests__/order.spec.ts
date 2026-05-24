import { InvalidStateError, ValidationError } from '../../../../../shared/errors/domain.error';
import { Address } from '../../value-objects/address.vo';
import { Document } from '../../value-objects/document.vo';
import { Money } from '../../value-objects/money.vo';
import { OrderNumber } from '../../value-objects/order-number.vo';
import { OrderItem } from '../order-item.entity';
import { Order } from '../order.entity';

function buildAddress(): Address {
  return Address.create({
    zipCode: '01310100',
    street: 'Av. Paulista',
    number: '1578',
    district: 'Bela Vista',
    city: 'São Paulo',
    state: 'SP',
  });
}

function buildOrder(overrides: Partial<{ forecast: Date }> = {}): Order {
  return Order.create({
    id: 'order-1',
    number: OrderNumber.format(2026, 1),
    customerName: 'Mariana Silva',
    customerDocument: Document.create('52998224725'),
    deliveryAddress: buildAddress(),
    deliveryForecastAt: overrides.forecast ?? new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    items: [
      OrderItem.create({
        id: 'item-1',
        description: 'Camiseta',
        price: Money.fromCents(4990),
        quantity: 1,
      }),
      OrderItem.create({
        id: 'item-2',
        description: 'Bermuda',
        price: Money.fromCents(8990),
        quantity: 1,
      }),
    ],
    actorId: 'user-1',
  });
}

describe('Order', () => {
  it('creates a PENDING order and emits OrderCreated', () => {
    const order = buildOrder();
    expect(order.status).toBe('PENDING');
    expect(order.items).toHaveLength(2);
    expect(order.total.cents).toBe(13980);
    const events = order.pullEvents();
    expect(events).toHaveLength(1);
    expect(events[0]?.name).toBe('order.created');
  });

  it('rejects empty items', () => {
    expect(() =>
      Order.create({
        id: 'order-2',
        number: OrderNumber.format(2026, 2),
        customerName: 'Buyer',
        customerDocument: Document.create('52998224725'),
        deliveryAddress: buildAddress(),
        deliveryForecastAt: new Date(Date.now() + 86_400_000),
        items: [],
        actorId: null,
      }),
    ).toThrow(ValidationError);
  });

  it('rejects forecast in the past', () => {
    expect(() => buildOrder({ forecast: new Date(Date.now() - 1000) })).toThrow(ValidationError);
  });

  it('transitions status and emits OrderStatusChanged', () => {
    const order = buildOrder();
    order.pullEvents();
    order.changeStatus('IN_TRANSIT', 'user-1');
    expect(order.status).toBe('IN_TRANSIT');
    const events = order.pullEvents();
    expect(events).toHaveLength(1);
    expect(events[0]?.name).toBe('order.status_changed');
  });

  it('blocks invalid status transition', () => {
    const order = buildOrder();
    expect(() => order.changeStatus('DELIVERED', 'user-1')).toThrow(InvalidStateError);
  });

  it('soft deletes once', () => {
    const order = buildOrder();
    order.softDelete();
    expect(order.isDeleted).toBe(true);
    const firstDeletion = order.deletedAt;
    order.softDelete();
    expect(order.deletedAt).toBe(firstDeletion);
  });
});
