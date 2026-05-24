import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class SignInRequestDto {
  @ApiProperty({ example: 'admin@naporta.test' })
  @IsEmail({}, { message: 'email deve ser um endereço de e-mail válido' })
  email!: string;

  @ApiProperty({ example: 'Admin@123', minLength: 8 })
  @IsString({ message: 'password deve ser uma string' })
  @MinLength(8, { message: 'password deve ter no mínimo 8 caracteres' })
  password!: string;
}
