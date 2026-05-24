import { ApiProperty } from '@nestjs/swagger';
import { IsJWT } from 'class-validator';

export class RefreshTokenRequestDto {
  @ApiProperty()
  @IsJWT()
  refreshToken!: string;
}
