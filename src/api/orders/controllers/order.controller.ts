import { Body, Controller, Post } from '@nestjs/common';
import { OrderService } from '../services/order.service';
import {
  ApiOperation,
  ApiCreatedResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { CreateOrderRequestDto } from '../dtos/create-order.request.dto';
import { Order } from '../schemas/order.schema';

@Controller('orders')
export class OrderController {
  constructor(private readonly service: OrderService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new order' })
  @ApiCreatedResponse({
    description: 'Order successfully created',
    type: Order,
  })
  @ApiBadRequestResponse({
    description: 'Invalid order data provided',
  })
  async create(@Body() request: CreateOrderRequestDto): Promise<Order> {
    return await this.service.create(request);
  }
}
