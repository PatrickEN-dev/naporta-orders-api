import { Inject, Injectable } from '@nestjs/common';
import { UnauthorizedError } from '../../../../shared/errors/domain.error';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '../../../users/domain/repositories/user.repository';
import type { AuthTokens } from '../dtos/auth-tokens';
import { HashService } from '../services/hash.service';
import { TokenService } from '../services/token.service';

interface SignInInput {
  email: string;
  password: string;
}

@Injectable()
export class SignInUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    private readonly hash: HashService,
    private readonly tokens: TokenService,
  ) {}

  async execute({ email, password }: SignInInput): Promise<AuthTokens> {
    const user = await this.users.findByEmail(email);
    if (!user) throw new UnauthorizedError('credenciais inválidas');

    const isValid = await this.hash.verifyPassword(user.passwordHash, password);
    if (!isValid) throw new UnauthorizedError('credenciais inválidas');

    const pair = await this.tokens.issueTokens({ sub: user.id, email: user.email });
    await this.users.updateRefreshToken(user.id, this.hash.hashToken(pair.refreshToken));
    return pair;
  }
}
