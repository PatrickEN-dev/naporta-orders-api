import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import type { Env } from '../../config/env.schema';
import { UsersModule } from '../users/users.module';
import { HashService } from './application/services/hash.service';
import { TokenService } from './application/services/token.service';
import { RefreshTokenUseCase } from './application/use-cases/refresh-token.use-case';
import { SignInUseCase } from './application/use-cases/sign-in.use-case';
import { SignOutUseCase } from './application/use-cases/sign-out.use-case';
import { AuthController } from './infra/http/auth.controller';
import { JwtStrategy } from './infra/strategies/jwt.strategy';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        secret: config.get('JWT_ACCESS_SECRET', { infer: true }),
        signOptions: { expiresIn: config.get('JWT_ACCESS_TTL', { infer: true }) },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    HashService,
    TokenService,
    SignInUseCase,
    RefreshTokenUseCase,
    SignOutUseCase,
    JwtStrategy,
  ],
  exports: [HashService],
})
export class AuthModule {}
