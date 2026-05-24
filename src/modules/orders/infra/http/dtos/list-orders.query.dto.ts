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
  @IsString({ message: 'number deve ser uma string' })
  number?: string;

  @ApiPropertyOptional({ enum: ORDER_STATUSES })
  @IsOptional()
  @IsEnum(ORDER_STATUSES, { message: ORDER_STATUS_ENUM_MESSAGE })
  status?: OrderStatusValue;

  @ApiPropertyOptional({
    example: '2026-01-01',
    description: 'ISO 8601. Início do intervalo (createdAt)',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'startDate deve ser uma data ISO 8601 válida' })
  startDate?: Date;

  @ApiPropertyOptional({
    example: '2026-12-31',
    description: 'ISO 8601. Fim do intervalo (createdAt)',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'endDate deve ser uma data ISO 8601 válida' })
  endDate?: Date;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'page deve ser um inteiro' })
  @Min(1, { message: 'page deve ser maior ou igual a 1' })
  page?: number;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit deve ser um inteiro' })
  @Min(1, { message: 'limit deve ser maior ou igual a 1' })
  @Max(100, { message: 'limit deve ser menor ou igual a 100' })
  limit?: number;

  @ApiPropertyOptional({
    example: '-createdAt',
    description: 'createdAt | deliveryForecastAt; prefixo "-" = desc',
  })
  @IsOptional()
  @IsString({ message: 'sort deve ser uma string' })
  sort?: string;
}
