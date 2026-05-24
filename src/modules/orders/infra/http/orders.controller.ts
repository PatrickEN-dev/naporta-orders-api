import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../../auth/application/dtos/auth-tokens';
import { CreateOrderUseCase } from '../../application/use-cases/create-order.use-case';
import { FindOrderUseCase } from '../../application/use-cases/find-order.use-case';
import { ListOrdersUseCase } from '../../application/use-cases/list-orders.use-case';
import { SoftDeleteOrderUseCase } from '../../application/use-cases/soft-delete-order.use-case';
import { UpdateOrderUseCase } from '../../application/use-cases/update-order.use-case';
import { CreateOrderRequestDto } from './dtos/create-order.request.dto';
import { ListOrdersQueryDto } from './dtos/list-orders.query.dto';
import { UpdateOrderRequestDto } from './dtos/update-order.request.dto';
import {
  OrderPresenter,
  OrderResponse,
  PaginatedOrdersResponse,
} from './presenters/order.presenter';

@ApiTags('orders')
@ApiBearerAuth('access-token')
@Controller('orders')
export class OrdersController {
  constructor(
    private readonly createOrder: CreateOrderUseCase,
    private readonly listOrders: ListOrdersUseCase,
    private readonly findOrder: FindOrderUseCase,
    private readonly updateOrder: UpdateOrderUseCase,
    private readonly softDeleteOrder: SoftDeleteOrderUseCase,
  ) {}

  @Post()
  @ApiCreatedResponse({ type: OrderResponse })
  async create(
    @Body() dto: CreateOrderRequestDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<OrderResponse> {
    const order = await this.createOrder.execute({
      customerName: dto.customerName,
      customerDocument: dto.customerDocument,
      deliveryAddress: dto.deliveryAddress,
      deliveryForecastAt: dto.deliveryForecastAt,
      items: dto.items,
      actorId: user.sub,
    });
    return OrderPresenter.toResponse(order);
  }

  @Get()
  @ApiOkResponse({ type: PaginatedOrdersResponse })
  async list(@Query() query: ListOrdersQueryDto): Promise<PaginatedOrdersResponse> {
    const result = await this.listOrders.execute(query);
    return OrderPresenter.toPaginatedResponse(
      result.items,
      result.page,
      result.limit,
      result.total,
    );
  }

  @Get(':id')
  @ApiOkResponse({ type: OrderResponse })
  async find(@Param('id', ParseUUIDPipe) id: string): Promise<OrderResponse> {
    const order = await this.findOrder.execute(id);
    return OrderPresenter.toResponse(order);
  }

  @Patch(':id')
  @ApiOkResponse({ type: OrderResponse })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrderRequestDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<OrderResponse> {
    const order = await this.updateOrder.execute({
      orderId: id,
      deliveryAddress: dto.deliveryAddress,
      deliveryForecastAt: dto.deliveryForecastAt,
      status: dto.status,
      items: dto.items,
      actorId: user.sub,
    });
    return OrderPresenter.toResponse(order);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.softDeleteOrder.execute(id);
  }
}
