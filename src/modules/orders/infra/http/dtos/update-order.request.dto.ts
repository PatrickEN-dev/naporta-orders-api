import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDate,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import {
  ORDER_STATUSES,
  type OrderStatusValue,
} from '../../../domain/value-objects/order-status.vo';
import { OrderAddressDto } from './order-address.dto';
import { OrderItemDto } from './order-item.dto';

export class UpdateOrderRequestDto {
  @ApiPropertyOptional({ type: OrderAddressDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => OrderAddressDto)
  deliveryAddress?: OrderAddressDto;

  @ApiPropertyOptional({ example: '2026-12-31T18:00:00.000Z' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  deliveryForecastAt?: Date;

  @ApiPropertyOptional({ enum: ORDER_STATUSES })
  @IsOptional()
  @IsEnum(ORDER_STATUSES)
  status?: OrderStatusValue;

  @ApiPropertyOptional({
    example: 'Cliente solicitou cancelamento',
    description: 'Nota opcional registrada em OrderStatusHistory quando o status muda',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  statusNote?: string;

  @ApiPropertyOptional({ type: [OrderItemDto] })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items?: OrderItemDto[];
}
