import { ValidationError } from '../../../../shared/errors/domain.error';
import { ValueObject } from '../../../../shared/domain/value-object.base';

interface AddressProps {
  zipCode: string;
  street: string;
  number: string;
  complement: string | null;
  district: string;
  city: string;
  state: string;
  country: string;
}

export interface AddressInput {
  zipCode: string;
  street: string;
  number: string;
  complement?: string | null;
  district: string;
  city: string;
  state: string;
  country?: string;
}

export class Address extends ValueObject<AddressProps> {
  private constructor(props: AddressProps) {
    super(props);
  }

  static create(input: AddressInput): Address {
    const zipCode = input.zipCode.replace(/\D/g, '');
    if (zipCode.length !== 8) {
      throw new ValidationError('zipCode must contain 8 digits');
    }
    if (input.state.length !== 2) {
      throw new ValidationError('state must be a 2-letter UF code');
    }
    return new Address({
      zipCode,
      street: input.street.trim(),
      number: input.number.trim(),
      complement: input.complement?.trim() || null,
      district: input.district.trim(),
      city: input.city.trim(),
      state: input.state.toUpperCase(),
      country: (input.country ?? 'BR').toUpperCase(),
    });
  }

  get zipCode(): string {
    return this.props.zipCode;
  }
  get street(): string {
    return this.props.street;
  }
  get number(): string {
    return this.props.number;
  }
  get complement(): string | null {
    return this.props.complement;
  }
  get district(): string {
    return this.props.district;
  }
  get city(): string {
    return this.props.city;
  }
  get state(): string {
    return this.props.state;
  }
  get country(): string {
    return this.props.country;
  }
}
