import { assert, assertPositiveInteger } from '../../../../shared/domain/assert';
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
    assert(description.length > 0, 'descrição do item não pode ser vazia');
    assertPositiveInteger(
      props.quantity,
      'quantidade do item deve ser um inteiro maior ou igual a 1',
    );
    return new OrderItem({ ...props, description });
  }

  get subtotal(): Money {
    return Money.fromCents(this.price.cents * this.quantity);
  }
}
