import { ValidationError } from '../../../../shared/errors/domain.error';
import { Entity } from '../../../../shared/domain/entity.base';
import { type Money } from '../value-objects/money.vo';

interface OrderItemProps {
  id: string;
  description: string;
  price: Money;
}

export class OrderItem extends Entity {
  readonly description: string;
  readonly price: Money;

  private constructor(props: OrderItemProps) {
    super(props.id);
    this.description = props.description;
    this.price = props.price;
  }

  static create(props: OrderItemProps): OrderItem {
    const description = props.description.trim();
    if (description.length === 0) {
      throw new ValidationError('OrderItem description cannot be empty');
    }
    return new OrderItem({ ...props, description });
  }
}
