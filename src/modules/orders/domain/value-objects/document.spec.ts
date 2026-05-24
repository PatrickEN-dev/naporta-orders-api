import { ValidationError } from '../../../../shared/errors/domain.error';
import { Document } from './document.vo';

describe('Document', () => {
  it('accepts a valid CPF (digits only)', () => {
    const doc = Document.create('52998224725');
    expect(doc.value).toBe('52998224725');
    expect(doc.type).toBe('CPF');
  });

  it('accepts a valid CPF formatted', () => {
    const doc = Document.create('529.982.247-25');
    expect(doc.value).toBe('52998224725');
  });

  it('rejects CPF with wrong check digits', () => {
    expect(() => Document.create('12345678910')).toThrow(ValidationError);
  });

  it('rejects CPF with all equal digits', () => {
    expect(() => Document.create('11111111111')).toThrow(ValidationError);
  });

  it('accepts a valid CNPJ', () => {
    const doc = Document.create('11.444.777/0001-61');
    expect(doc.value).toBe('11444777000161');
    expect(doc.type).toBe('CNPJ');
  });

  it('rejects CNPJ with wrong check digits', () => {
    expect(() => Document.create('11444777000162')).toThrow(ValidationError);
  });

  it('rejects values with invalid length', () => {
    expect(() => Document.create('123')).toThrow(ValidationError);
  });
});
