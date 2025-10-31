import { MongoMapper } from '@api/core/repository/mongo.mapper';
import { OrderEntity } from '@api/orders/domain/entities/order.entity';
import { Injectable } from '@nestjs/common';
import { OrderMongoDocument } from '../schemas/order.mongo.schema';

@Injectable()
export class OrderMongoMapper {
  private readonly base = new MongoMapper<OrderMongoDocument, OrderEntity>();

  public toEntity(document: OrderMongoDocument): OrderEntity {
    const { recordId, ...rest } = this.base.toEntity(document);

    if (!recordId) {
      throw new Error('recordId is missing in OrderMongoDocument');
    }

    return { ...rest, recordId: recordId.toString() };
  }
}
