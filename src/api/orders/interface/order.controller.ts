import { Body, Controller, Inject, Post } from '@nestjs/common';
import {
  ApiOperation,
  ApiCreatedResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { OrderEntity } from '../domain/entities/order.entity';
import { CreateOrderRequestDto } from '../application/dtos/create-order.request.dto';
import { OrderServicePort } from '../domain/ports/order.service.port';

@Controller('orders')
export class OrderController {
  constructor(
    @Inject(OrderServicePort)
    private readonly service: OrderServicePort,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new order' })
  @ApiCreatedResponse({
    description: 'Order successfully created',
    type: OrderEntity,
  })
  @ApiBadRequestResponse({
    description: 'Invalid order data provided',
  })
  async create(@Body() request: CreateOrderRequestDto): Promise<OrderEntity> {
    return await this.service.create(request);
  }
}
