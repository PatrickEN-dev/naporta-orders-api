import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, MinLength, Min } from 'class-validator';

export class OrderItemDto {
  @ApiProperty({ example: 'Camiseta básica preta P' })
  @IsString()
  @MinLength(1)
  description!: string;

  @ApiProperty({ example: 4990, description: 'Preço em centavos (R$ 49,90 => 4990)' })
  @IsInt()
  @Min(0)
  priceCents!: number;
}
