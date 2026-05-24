import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Min, MinLength } from 'class-validator';

export class OrderItemDto {
  @ApiProperty({ example: 'Camiseta básica preta P' })
  @IsString()
  @MinLength(1)
  description!: string;

  @ApiProperty({ example: 4990, description: 'Preço unitário em centavos (R$ 49,90 => 4990)' })
  @IsInt()
  @Min(0)
  priceCents!: number;

  @ApiProperty({ example: 1, description: 'Quantidade do item, mínimo 1' })
  @IsInt()
  @Min(1)
  quantity!: number;
}
