import { OrderRepositoryPort } from '@api/orders/domain/ports/order.repository.port';
import { Injectable, Logger } from '@nestjs/common';
import { OrderMongoMapper } from './mappers/order.mongo.mapper';
import {
  OrderEntity,
  OrderEntityCore,
} from '@api/orders/domain/entities/order.entity';
import { OrderMongoDocument } from './schemas/order.mongo.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { stringifyUnknownVariable } from '@api/core/log/stringify-unknown-variable.util';
import { stringifyUnknownError } from '@api/core/log/stringify-unknown-error.util';

@Injectable()
export class OrderMongoRepository implements OrderRepositoryPort {
  private readonly logger = new Logger(OrderMongoRepository.name);
  private readonly mapper = new OrderMongoMapper();

  constructor(
    @InjectModel(OrderMongoDocument.name)
    private readonly model: Model<OrderMongoDocument>,
  ) {}

  async create(order: Partial<OrderEntityCore>): Promise<OrderEntity> {
    try {
      const doc = await this.model.create(order);
      return this.mapper.toEntity(doc);
    } catch (error) {
      this.logger.error(
        `[Order.create] Failed to create order with payload ${stringifyUnknownVariable(order)}: ${stringifyUnknownError(error)}`,
      );
      throw error;
    }
  }
}
