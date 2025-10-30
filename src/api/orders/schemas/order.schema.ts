import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Record } from '../../records/schemas/record.schema';

@Schema({
  timestamps: {
    createdAt: 'created',
    updatedAt: 'lastModified',
  },
})
export class Order extends Document {
  @Prop({ type: Types.ObjectId, ref: Record.name, required: true })
  recordId: Types.ObjectId;

  @Prop({ required: true, min: 1 })
  qty: number;

  @Prop({ type: [String], default: [] })
  searchTokens: string[];
}

export const OrderSchema = SchemaFactory.createForClass(Order);

OrderSchema.index({ recordId: 1 });
