import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length, MaxLength, MinLength } from 'class-validator';

export class OrderAddressDto {
  @ApiProperty({ example: '01310100' })
  @IsString({ message: 'zipCode deve ser uma string' })
  @Length(8, 9, { message: 'zipCode deve ter 8 dígitos (aceita com ou sem traço)' })
  zipCode!: string;

  @ApiProperty({ example: 'Av. Paulista' })
  @IsString({ message: 'street deve ser uma string' })
  @MinLength(1, { message: 'street é obrigatória' })
  street!: string;

  @ApiProperty({ example: '1578' })
  @IsString({ message: 'number deve ser uma string' })
  @MinLength(1, { message: 'number é obrigatório (use "S/N" se não houver)' })
  number!: string;

  @ApiPropertyOptional({ example: 'Apto 101' })
  @IsOptional()
  @IsString({ message: 'complement deve ser uma string' })
  complement?: string;

  @ApiProperty({ example: 'Bela Vista' })
  @IsString({ message: 'district deve ser uma string' })
  @MinLength(1, { message: 'district é obrigatório' })
  district!: string;

  @ApiProperty({ example: 'São Paulo' })
  @IsString({ message: 'city deve ser uma string' })
  @MinLength(1, { message: 'city é obrigatória' })
  city!: string;

  @ApiProperty({ example: 'SP', minLength: 2, maxLength: 2 })
  @IsString({ message: 'state deve ser uma string' })
  @Length(2, 2, { message: 'state deve ter exatamente 2 letras (UF)' })
  state!: string;

  @ApiPropertyOptional({ example: 'BR', default: 'BR' })
  @IsOptional()
  @IsString({ message: 'country deve ser uma string' })
  @MaxLength(2, { message: 'country deve ter no máximo 2 letras' })
  country?: string;
}
