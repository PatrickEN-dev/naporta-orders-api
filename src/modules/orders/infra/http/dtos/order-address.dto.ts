import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length, MaxLength, MinLength } from 'class-validator';

export class OrderAddressDto {
  @ApiProperty({ example: '01310100' })
  @IsString()
  @Length(8, 9)
  zipCode!: string;

  @ApiProperty({ example: 'Av. Paulista' })
  @IsString()
  @MinLength(1)
  street!: string;

  @ApiProperty({ example: '1578' })
  @IsString()
  @MinLength(1)
  number!: string;

  @ApiPropertyOptional({ example: 'Apto 101' })
  @IsOptional()
  @IsString()
  complement?: string;

  @ApiProperty({ example: 'Bela Vista' })
  @IsString()
  @MinLength(1)
  district!: string;

  @ApiProperty({ example: 'São Paulo' })
  @IsString()
  @MinLength(1)
  city!: string;

  @ApiProperty({ example: 'SP', minLength: 2, maxLength: 2 })
  @IsString()
  @Length(2, 2)
  state!: string;

  @ApiPropertyOptional({ example: 'BR', default: 'BR' })
  @IsOptional()
  @IsString()
  @MaxLength(2)
  country?: string;
}
