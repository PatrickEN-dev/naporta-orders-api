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
  @IsString()
  @MinLength(1)
  customerName!: string;

  @ApiProperty({
    example: '529.982.247-25',
    description: 'CPF ou CNPJ; aceita formatado ou apenas dígitos',
  })
  @IsString()
  @Matches(/^[\d.\-/\s]+$/, { message: 'customerDocument contains invalid characters' })
  customerDocument!: string;

  @ApiProperty({ type: OrderAddressDto })
  @ValidateNested()
  @Type(() => OrderAddressDto)
  deliveryAddress!: OrderAddressDto;

  @ApiProperty({ example: '2026-12-31T18:00:00.000Z' })
  @Type(() => Date)
  @IsDate()
  deliveryForecastAt!: Date;

  @ApiProperty({ type: [OrderItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items!: OrderItemDto[];
}
