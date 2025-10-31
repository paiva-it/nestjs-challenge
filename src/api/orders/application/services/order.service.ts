import { Inject, Injectable } from '@nestjs/common';

import { CreateOrderRequestDto } from '../dtos/create-order.request.dto';
import { OrderRepositoryPort } from '@api/orders/domain/ports/order.repository.port';
import { OrderEntity } from '@api/orders/domain/entities/order.entity';
import { Transactional } from '@api/core/tx/transactional.decorator';
import { RecordServicePort } from '@api/records/domain/ports/record.service.port';
import { OrderServicePort } from '@api/orders/domain/ports/order.service.port';

@Injectable()
export class OrderService implements OrderServicePort {
  constructor(
    @Inject(OrderRepositoryPort)
    private readonly repository: OrderRepositoryPort,
    @Inject(RecordServicePort)
    private readonly recordService: RecordServicePort,
  ) {}

  @Transactional()
  async create(dto: CreateOrderRequestDto): Promise<OrderEntity> {
    await this.recordService.decreaseQuantity(dto.recordId, dto.qty);

    return await this.repository.create(dto);
  }
}
