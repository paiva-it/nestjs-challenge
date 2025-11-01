import { OrderEntity } from '@api/orders/domain/entities/order.entity';
import { RecordMongoDocument } from '@api/records/infrastructure/repository/mongodb/schemas/record.mongo.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({
  collection: 'orders',
  timestamps: {
    createdAt: 'created',
    updatedAt: 'lastModified',
  },
})
export class OrderMongoDocument
  extends Document
  implements Omit<OrderEntity, 'id' | 'recordId'>
{
  @Prop({ required: true, min: 1 })
  qty: number;

  /* DB specific typing */
  @Prop({ type: Types.ObjectId, ref: RecordMongoDocument.name, required: true })
  recordId: Types.ObjectId;

  /* Timestamps managed by @Schema Mongoose decorator */
  created: Date;
  lastModified: Date;
}

export const OrderMongoSchema =
  SchemaFactory.createForClass(OrderMongoDocument);

OrderMongoSchema.index({ recordId: 1 });
