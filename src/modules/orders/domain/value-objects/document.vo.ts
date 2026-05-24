import { assert } from '../../../../shared/domain/assert';
import { ValueObject } from '../../../../shared/domain/value-object.base';

const CPF_LENGTH = 11;
const CNPJ_LENGTH = 14;

export class Document extends ValueObject<{ digits: string }> {
  private constructor(digits: string) {
    super({ digits });
  }

  static create(raw: string): Document {
    const digits = raw.replace(/\D/g, '');
    if (digits.length === CPF_LENGTH) {
      assert(isValidCpf(digits), 'CPF inválido');
      return new Document(digits);
    }
    if (digits.length === CNPJ_LENGTH) {
      assert(isValidCnpj(digits), 'CNPJ inválido');
      return new Document(digits);
    }
    assert(false, 'documento deve ser um CPF válido (11 dígitos) ou CNPJ válido (14 dígitos)');
  }

  get value(): string {
    return this.props.digits;
  }

  get type(): 'CPF' | 'CNPJ' {
    return this.props.digits.length === CPF_LENGTH ? 'CPF' : 'CNPJ';
  }
}

function isValidCpf(digits: string): boolean {
  if (/^(\d)\1+$/.test(digits)) return false;
  const numbers = digits.split('').map(Number);
  const dv1 = checkDigit(numbers.slice(0, 9), 10);
  if (dv1 !== numbers[9]) return false;
  const dv2 = checkDigit(numbers.slice(0, 10), 11);
  return dv2 === numbers[10];
}

function isValidCnpj(digits: string): boolean {
  if (/^(\d)\1+$/.test(digits)) return false;
  const numbers = digits.split('').map(Number);
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, ...weights1];
  const dv1 = weightedDigit(numbers.slice(0, 12), weights1);
  if (dv1 !== numbers[12]) return false;
  const dv2 = weightedDigit(numbers.slice(0, 13), weights2);
  return dv2 === numbers[13];
}

function checkDigit(numbers: number[], startWeight: number): number {
  const sum = numbers.reduce((acc, digit, index) => acc + digit * (startWeight - index), 0);
  const rest = (sum * 10) % 11;
  return rest === 10 ? 0 : rest;
}

function weightedDigit(numbers: number[], weights: number[]): number {
  const sum = numbers.reduce((acc, digit, index) => acc + digit * weights[index], 0);
  const rest = sum % 11;
  return rest < 2 ? 0 : 11 - rest;
}
