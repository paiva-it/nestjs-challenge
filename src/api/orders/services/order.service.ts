import { Inject, Injectable } from '@nestjs/common';
import { OrderRepositoryPort } from '../port/order.repository.port';
import { CreateOrderRequestDto } from '../dtos/create-order.request.dto';
import { Order } from '../schemas/order.schema';

@Injectable()
export class OrderService {
  constructor(
    @Inject(OrderRepositoryPort)
    private readonly repository: OrderRepositoryPort,
  ) {}

  async create(dto: CreateOrderRequestDto): Promise<Order> {
    return await this.repository.create(dto);
  }
}
