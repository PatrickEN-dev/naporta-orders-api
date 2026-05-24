import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDate,
  IsString,
  Matches,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { OrderAddressDto } from './order-address.dto';
import { OrderItemDto } from './order-item.dto';

export class CreateOrderRequestDto {
  @ApiProperty({ example: 'Mariana Silva' })
  @IsString({ message: 'customerName deve ser uma string' })
  @MinLength(1, { message: 'customerName é obrigatório' })
  customerName!: string;

  @ApiProperty({
    example: '529.982.247-25',
    description: 'CPF ou CNPJ; aceita formatado ou apenas dígitos',
  })
  @IsString({ message: 'customerDocument deve ser uma string' })
  @Matches(/^[\d.\-/\s]+$/, {
    message: 'customerDocument deve conter apenas dígitos, pontos, traços e barra',
  })
  customerDocument!: string;

  @ApiProperty({ type: OrderAddressDto })
  @ValidateNested()
  @Type(() => OrderAddressDto)
  deliveryAddress!: OrderAddressDto;

  @ApiProperty({
    example: '2027-12-31',
    description: 'ISO 8601. Aceita "YYYY-MM-DD" ou "YYYY-MM-DDTHH:mm:ss.sssZ"',
  })
  @Type(() => Date)
  @IsDate({ message: 'deliveryForecastAt deve ser uma data ISO 8601 válida' })
  deliveryForecastAt!: Date;

  @ApiProperty({ type: [OrderItemDto] })
  @IsArray({ message: 'items deve ser uma lista' })
  @ArrayMinSize(1, { message: 'items deve conter ao menos 1 item' })
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items!: OrderItemDto[];
}
