import { UnauthorizedError } from '../../../../shared/errors/domain.error';
import { User } from '../../../users/domain/entities/user.entity';
import { InMemoryUserRepository } from '../../../users/__tests__/in-memory-user.repository';
import { HashService } from '../services/hash.service';
import type { TokenService } from '../services/token.service';
import { SignInUseCase } from './sign-in.use-case';

describe('SignInUseCase', () => {
  let users: InMemoryUserRepository;
  let hash: HashService;
  let tokens: jest.Mocked<Pick<TokenService, 'issueTokens' | 'verifyRefreshToken'>>;
  let useCase: SignInUseCase;

  beforeEach(async () => {
    users = new InMemoryUserRepository();
    hash = new HashService();
    tokens = {
      issueTokens: jest.fn().mockResolvedValue({ accessToken: 'access', refreshToken: 'refresh' }),
      verifyRefreshToken: jest.fn(),
    };
    useCase = new SignInUseCase(users, hash, tokens as unknown as TokenService);

    const passwordHash = await hash.hashPassword('secret123');
    users.set(
      User.restore({
        id: 'user-1',
        email: 'a@b.com',
        passwordHash,
        refreshTokenHash: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    );
  });

  it('returns tokens for valid credentials', async () => {
    const result = await useCase.execute({ email: 'a@b.com', password: 'secret123' });
    expect(result).toEqual({ accessToken: 'access', refreshToken: 'refresh' });
    const stored = await users.findById('user-1');
    expect(stored?.refreshTokenHash).toBe(hash.hashToken('refresh'));
  });

  it('rejects unknown email', async () => {
    await expect(useCase.execute({ email: 'x@y.com', password: 'secret123' })).rejects.toThrow(
      UnauthorizedError,
    );
  });

  it('rejects wrong password', async () => {
    await expect(useCase.execute({ email: 'a@b.com', password: 'wrong' })).rejects.toThrow(
      UnauthorizedError,
    );
  });
});
