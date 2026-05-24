import { ValidationError } from '../../../../shared/errors/domain.error';
import { Entity } from '../../../../shared/domain/entity.base';
import { Money } from '../value-objects/money.vo';

interface OrderItemProps {
  id: string;
  description: string;
  price: Money;
  quantity: number;
}

export class OrderItem extends Entity {
  readonly description: string;
  readonly price: Money;
  readonly quantity: number;

  private constructor(props: OrderItemProps) {
    super(props.id);
    this.description = props.description;
    this.price = props.price;
    this.quantity = props.quantity;
  }

  static create(props: OrderItemProps): OrderItem {
    const description = props.description.trim();
    if (description.length === 0) {
      throw new ValidationError('OrderItem description cannot be empty');
    }
    if (!Number.isInteger(props.quantity) || props.quantity < 1) {
      throw new ValidationError('OrderItem quantity must be a positive integer');
    }
    return new OrderItem({ ...props, description });
  }

  get subtotal(): Money {
    return Money.fromCents(this.price.cents * this.quantity);
  }
}
