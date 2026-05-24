export abstract class ValueObject<TProps extends object> {
  protected readonly props: Readonly<TProps>;

  protected constructor(props: TProps) {
    this.props = Object.freeze({ ...props });
  }

  equals(other?: ValueObject<TProps> | null): boolean {
    if (!other) return false;
    if (this === other) return true;
    if (other.constructor !== this.constructor) return false;
    return shallowEqual(this.props, other.props);
  }
}

function shallowEqual(a: Record<string, unknown>, b: Record<string, unknown>): boolean {
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  for (const key of keysA) {
    const valueA = a[key];
    const valueB = b[key];
    if (valueA instanceof Date && valueB instanceof Date) {
      if (valueA.getTime() !== valueB.getTime()) return false;
      continue;
    }
    if (valueA !== valueB) return false;
  }
  return true;
}
