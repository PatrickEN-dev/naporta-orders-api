import { HashService } from './hash.service';

describe('HashService', () => {
  const service = new HashService();

  describe('password (argon2id)', () => {
    it('hashes and verifies', async () => {
      const hash = await service.hashPassword('My$ecret123');
      expect(hash).not.toBe('My$ecret123');
      expect(await service.verifyPassword(hash, 'My$ecret123')).toBe(true);
      expect(await service.verifyPassword(hash, 'wrong')).toBe(false);
    });
  });

  describe('token (sha256)', () => {
    it('produces deterministic hex', () => {
      const hash = service.hashToken('jwt.token.value');
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
      expect(service.hashToken('jwt.token.value')).toBe(hash);
    });

    it('matchesToken returns true for same token', () => {
      const hash = service.hashToken('abc.def.ghi');
      expect(service.matchesToken(hash, 'abc.def.ghi')).toBe(true);
    });

    it('matchesToken returns false for different token', () => {
      const hash = service.hashToken('abc.def.ghi');
      expect(service.matchesToken(hash, 'other')).toBe(false);
    });

    it('matchesToken returns false for malformed hash', () => {
      expect(service.matchesToken('not-hex', 'x')).toBe(false);
    });
  });
});
