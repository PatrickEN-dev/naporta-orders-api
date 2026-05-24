import { ApiProperty } from '@nestjs/swagger';
import { IsJWT } from 'class-validator';

export class RefreshTokenRequestDto {
  @ApiProperty()
  @IsJWT({ message: 'refreshToken deve ser um JWT válido' })
  refreshToken!: string;
}
