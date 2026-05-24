import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator';
import { Public } from '../../../../common/decorators/public.decorator';
import type { AuthenticatedUser } from '../../application/dtos/auth-tokens';
import { RefreshTokenUseCase } from '../../application/use-cases/refresh-token.use-case';
import { SignInUseCase } from '../../application/use-cases/sign-in.use-case';
import { SignOutUseCase } from '../../application/use-cases/sign-out.use-case';
import { AuthTokensResponseDto } from './dtos/auth-tokens.response.dto';
import { RefreshTokenRequestDto } from './dtos/refresh-token.request.dto';
import { SignInRequestDto } from './dtos/sign-in.request.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly signInUseCase: SignInUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly signOutUseCase: SignOutUseCase,
  ) {}

  @Public()
  @Post('sign-in')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: AuthTokensResponseDto })
  signIn(@Body() dto: SignInRequestDto): Promise<AuthTokensResponseDto> {
    return this.signInUseCase.execute(dto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: AuthTokensResponseDto })
  refresh(@Body() dto: RefreshTokenRequestDto): Promise<AuthTokensResponseDto> {
    return this.refreshTokenUseCase.execute(dto);
  }

  @ApiBearerAuth('access-token')
  @Post('sign-out')
  @HttpCode(HttpStatus.NO_CONTENT)
  signOut(@CurrentUser() user: AuthenticatedUser): Promise<void> {
    return this.signOutUseCase.execute(user.sub);
  }
}
