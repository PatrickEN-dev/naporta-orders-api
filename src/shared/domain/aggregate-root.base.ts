import { Entity } from './entity.base';
import type { DomainEvent } from './domain-event';

export abstract class AggregateRoot<TId = string> extends Entity<TId> {
  private readonly _events: DomainEvent[] = [];
  protected _updatedAt: Date;

  protected constructor(id: TId, updatedAt: Date = new Date()) {
    super(id);
    this._updatedAt = updatedAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  protected touch(): void {
    this._updatedAt = new Date();
  }

  protected addEvent(event: DomainEvent): void {
    this._events.push(event);
  }

  pullEvents(): DomainEvent[] {
    const events = [...this._events];
    this._events.length = 0;
    return events;
  }
}
