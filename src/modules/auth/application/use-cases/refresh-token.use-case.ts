import { Inject, Injectable } from '@nestjs/common';
import { UnauthorizedError } from '../../../../shared/errors/domain.error';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '../../../users/domain/repositories/user.repository';
import type { AuthTokens } from '../dtos/auth-tokens';
import { HashService } from '../services/hash.service';
import { TokenService } from '../services/token.service';

interface RefreshTokenInput {
  refreshToken: string;
}

@Injectable()
export class RefreshTokenUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    private readonly hash: HashService,
    private readonly tokens: TokenService,
  ) {}

  async execute({ refreshToken }: RefreshTokenInput): Promise<AuthTokens> {
    const payload = await this.tokens.verifyRefreshToken(refreshToken).catch(() => {
      throw new UnauthorizedError('Invalid refresh token');
    });

    const user = await this.users.findById(payload.sub);
    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    if (!this.hash.matchesToken(user.refreshTokenHash, refreshToken)) {
      await this.users.updateRefreshToken(user.id, null);
      throw new UnauthorizedError('Invalid refresh token');
    }

    const pair = await this.tokens.issueTokens({ sub: user.id, email: user.email });
    await this.users.updateRefreshToken(user.id, this.hash.hashToken(pair.refreshToken));
    return pair;
  }
}
