import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import {
  ORDER_STATUSES,
  ORDER_STATUS_ENUM_MESSAGE,
  type OrderStatusValue,
} from '../../../domain/value-objects/order-status.vo';

export class ListOrdersQueryDto {
  @ApiPropertyOptional({ example: 'ORD-2026-000123' })
  @IsOptional()
  @IsString()
  number?: string;

  @ApiPropertyOptional({ enum: ORDER_STATUSES })
  @IsOptional()
  @IsEnum(ORDER_STATUSES, { message: ORDER_STATUS_ENUM_MESSAGE })
  status?: OrderStatusValue;

  @ApiPropertyOptional({ example: '2026-01-01T00:00:00.000Z' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @ApiPropertyOptional({ example: '2026-12-31T23:59:59.999Z' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({
    example: '-createdAt',
    description: 'createdAt | deliveryForecastAt; prefixo "-" = desc',
  })
  @IsOptional()
  @IsString()
  sort?: string;
}
