import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'node:crypto';
import type { Env } from '../../../../config/env.schema';
import type { AuthTokens, AuthenticatedUser } from '../dtos/auth-tokens';

interface TokenPayload {
  sub: string;
  email: string;
}

@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async issueTokens(payload: TokenPayload): Promise<AuthTokens> {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(
        { ...payload, jti: randomUUID() },
        {
          secret: this.config.get('JWT_ACCESS_SECRET', { infer: true }),
          expiresIn: this.config.get('JWT_ACCESS_TTL', { infer: true }),
        },
      ),
      this.jwt.signAsync(
        { ...payload, jti: randomUUID() },
        {
          secret: this.config.get('JWT_REFRESH_SECRET', { infer: true }),
          expiresIn: this.config.get('JWT_REFRESH_TTL', { infer: true }),
        },
      ),
    ]);
    return { accessToken, refreshToken };
  }

  verifyRefreshToken(token: string): Promise<AuthenticatedUser> {
    return this.jwt.verifyAsync<AuthenticatedUser>(token, {
      secret: this.config.get('JWT_REFRESH_SECRET', { infer: true }),
    });
  }
}
