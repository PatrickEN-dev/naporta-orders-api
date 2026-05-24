import { AggregateRoot } from '../../../../shared/domain/aggregate-root.base';
import { ValidationError } from '../../../../shared/errors/domain.error';
import { OrderCreatedEvent } from '../events/order-created.event';
import { OrderStatusChangedEvent } from '../events/order-status-changed.event';
import type { Address } from '../value-objects/address.vo';
import type { Document } from '../value-objects/document.vo';
import { Money } from '../value-objects/money.vo';
import type { OrderNumber } from '../value-objects/order-number.vo';
import { OrderStatus, type OrderStatusValue } from '../value-objects/order-status.vo';
import { type OrderItem } from './order-item.entity';

interface OrderProps {
  id: string;
  number: OrderNumber;
  customerName: string;
  customerDocument: Document;
  deliveryAddress: Address;
  deliveryForecastAt: Date;
  status: OrderStatus;
  items: OrderItem[];
  totalCents: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

interface CreateOrderProps {
  id: string;
  number: OrderNumber;
  customerName: string;
  customerDocument: Document;
  deliveryAddress: Address;
  deliveryForecastAt: Date;
  items: OrderItem[];
  actorId: string | null;
}

export class Order extends AggregateRoot {
  private _customerName: string;
  private _customerDocument: Document;
  private _deliveryAddress: Address;
  private _deliveryForecastAt: Date;
  private _status: OrderStatus;
  private _items: OrderItem[];
  private _totalCents: number;
  private _updatedAt: Date;
  private _deletedAt: Date | null;

  readonly number: OrderNumber;
  readonly createdAt: Date;

  private constructor(props: OrderProps) {
    super(props.id);
    this.number = props.number;
    this._customerName = props.customerName;
    this._customerDocument = props.customerDocument;
    this._deliveryAddress = props.deliveryAddress;
    this._deliveryForecastAt = props.deliveryForecastAt;
    this._status = props.status;
    this._items = [...props.items];
    this._totalCents = props.totalCents;
    this.createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
    this._deletedAt = props.deletedAt;
  }

  static create(props: CreateOrderProps): Order {
    Order.assertCustomerName(props.customerName);
    Order.assertItems(props.items);
    Order.assertForecastInFuture(props.deliveryForecastAt);

    const now = new Date();
    const order = new Order({
      id: props.id,
      number: props.number,
      customerName: props.customerName.trim(),
      customerDocument: props.customerDocument,
      deliveryAddress: props.deliveryAddress,
      deliveryForecastAt: props.deliveryForecastAt,
      status: OrderStatus.pending(),
      items: props.items,
      totalCents: 0,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });
    order.recalculateTotal();
    order.addEvent(new OrderCreatedEvent(order.id, order.status, props.actorId));
    return order;
  }

  static restore(props: OrderProps): Order {
    return new Order(props);
  }

  get customerName(): string {
    return this._customerName;
  }
  get customerDocument(): Document {
    return this._customerDocument;
  }
  get deliveryAddress(): Address {
    return this._deliveryAddress;
  }
  get deliveryForecastAt(): Date {
    return this._deliveryForecastAt;
  }
  get status(): OrderStatusValue {
    return this._status.value;
  }
  get items(): readonly OrderItem[] {
    return this._items;
  }
  get updatedAt(): Date {
    return this._updatedAt;
  }
  get deletedAt(): Date | null {
    return this._deletedAt;
  }
  get isDeleted(): boolean {
    return this._deletedAt !== null;
  }

  get total(): Money {
    return Money.fromCents(this._totalCents);
  }

  changeStatus(next: OrderStatusValue, actorId: string | null, notes?: string | null): void {
    if (this._status.value === next) return;
    const previous = this._status;
    this._status = previous.transitionTo(next);
    this.touch();
    this.addEvent(
      new OrderStatusChangedEvent(this.id, previous.value, next, actorId, notes ?? null),
    );
  }

  rescheduleDelivery(forecastAt: Date): void {
    Order.assertForecastInFuture(forecastAt);
    this._deliveryForecastAt = forecastAt;
    this.touch();
  }

  changeDeliveryAddress(address: Address): void {
    this._deliveryAddress = address;
    this.touch();
  }

  replaceItems(items: OrderItem[]): void {
    Order.assertItems(items);
    this._items = [...items];
    this.recalculateTotal();
    this.touch();
  }

  softDelete(): void {
    if (this._deletedAt) return;
    this._deletedAt = new Date();
    this.touch();
  }

  private recalculateTotal(): void {
    this._totalCents = this._items.reduce((sum, item) => sum + item.subtotal.cents, 0);
  }

  private touch(): void {
    this._updatedAt = new Date();
  }

  private static assertCustomerName(name: string): void {
    if (name.trim().length === 0) {
      throw new ValidationError('customerName cannot be empty');
    }
  }

  private static assertItems(items: OrderItem[]): void {
    if (items.length === 0) {
      throw new ValidationError('Order must contain at least one item');
    }
  }

  private static assertForecastInFuture(forecastAt: Date): void {
    if (forecastAt.getTime() <= Date.now()) {
      throw new ValidationError('deliveryForecastAt must be in the future');
    }
  }
}
