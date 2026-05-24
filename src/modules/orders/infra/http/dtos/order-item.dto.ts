import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Min, MinLength } from 'class-validator';

export class OrderItemDto {
  @ApiProperty({ example: 'Camiseta básica preta P' })
  @IsString({ message: 'description deve ser uma string' })
  @MinLength(1, { message: 'description não pode ser vazia' })
  description!: string;

  @ApiProperty({ example: 4990, description: 'Preço unitário em centavos (R$ 49,90 => 4990)' })
  @IsInt({ message: 'priceCents deve ser um inteiro (preço em centavos)' })
  @Min(0, { message: 'priceCents não pode ser negativo' })
  priceCents!: number;

  @ApiProperty({ example: 1, description: 'Quantidade do item, mínimo 1' })
  @IsInt({ message: 'quantity deve ser um inteiro' })
  @Min(1, { message: 'quantity deve ser maior ou igual a 1' })
  quantity!: number;
}
