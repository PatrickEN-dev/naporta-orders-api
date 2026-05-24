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
  ORDER_STATUS_ENUM_MESSAGE,
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

  @ApiPropertyOptional({
    example: '2027-12-31',
    description: 'ISO 8601. Aceita "YYYY-MM-DD" ou "YYYY-MM-DDTHH:mm:ss.sssZ"',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'deliveryForecastAt deve ser uma data ISO 8601 válida' })
  deliveryForecastAt?: Date;

  @ApiPropertyOptional({ enum: ORDER_STATUSES })
  @IsOptional()
  @IsEnum(ORDER_STATUSES, { message: ORDER_STATUS_ENUM_MESSAGE })
  status?: OrderStatusValue;

  @ApiPropertyOptional({
    example: 'Cliente solicitou cancelamento',
    description: 'Nota opcional registrada em OrderStatusHistory quando o status muda',
  })
  @IsOptional()
  @IsString({ message: 'statusNote deve ser uma string' })
  @MaxLength(500, { message: 'statusNote deve ter no máximo 500 caracteres' })
  statusNote?: string;

  @ApiPropertyOptional({ type: [OrderItemDto] })
  @IsOptional()
  @IsArray({ message: 'items deve ser uma lista' })
  @ArrayMinSize(1, { message: 'items deve conter ao menos 1 item' })
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items?: OrderItemDto[];
}
