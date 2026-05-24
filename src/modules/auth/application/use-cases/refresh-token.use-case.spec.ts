import { UnauthorizedError } from '../../../../shared/errors/domain.error';
import { User } from '../../../users/domain/entities/user.entity';
import { InMemoryUserRepository } from '../../../users/__tests__/in-memory-user.repository';
import { HashService } from '../services/hash.service';
import type { TokenService } from '../services/token.service';
import { RefreshTokenUseCase } from './refresh-token.use-case';

describe('RefreshTokenUseCase', () => {
  let users: InMemoryUserRepository;
  let hash: HashService;
  let tokens: jest.Mocked<Pick<TokenService, 'issueTokens' | 'verifyRefreshToken'>>;
  let useCase: RefreshTokenUseCase;

  beforeEach(() => {
    users = new InMemoryUserRepository();
    hash = new HashService();
    tokens = {
      issueTokens: jest
        .fn()
        .mockResolvedValue({ accessToken: 'new-access', refreshToken: 'new-refresh' }),
      verifyRefreshToken: jest.fn().mockResolvedValue({ sub: 'user-1', email: 'a@b.com' }),
    };
    useCase = new RefreshTokenUseCase(users, hash, tokens as unknown as TokenService);

    users.set(
      User.restore({
        id: 'user-1',
        email: 'a@b.com',
        passwordHash: 'irrelevant',
        refreshTokenHash: hash.hashToken('current-refresh'),
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    );
  });

  it('rotates tokens for valid refresh', async () => {
    const result = await useCase.execute({ refreshToken: 'current-refresh' });
    expect(result.accessToken).toBe('new-access');
    const stored = await users.findById('user-1');
    expect(stored?.refreshTokenHash).toBe(hash.hashToken('new-refresh'));
  });

  it('rejects invalid JWT', async () => {
    tokens.verifyRefreshToken.mockRejectedValueOnce(new Error('bad'));
    await expect(useCase.execute({ refreshToken: 'bad' })).rejects.toThrow(UnauthorizedError);
  });

  it('rejects when hash does not match and revokes user', async () => {
    await expect(useCase.execute({ refreshToken: 'wrong-refresh' })).rejects.toThrow(
      UnauthorizedError,
    );
    const stored = await users.findById('user-1');
    expect(stored?.refreshTokenHash).toBeNull();
  });

  it('rejects when user has no refresh token stored', async () => {
    users.set(
      User.restore({
        id: 'user-1',
        email: 'a@b.com',
        passwordHash: 'irrelevant',
        refreshTokenHash: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    );
    await expect(useCase.execute({ refreshToken: 'current-refresh' })).rejects.toThrow(
      UnauthorizedError,
    );
  });
});
