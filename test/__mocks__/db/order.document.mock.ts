import { Types } from 'mongoose';
import { OrderMongoDocument } from '@api/orders/infrastructure/repository/mongodb/schemas/order.mongo.schema';

export class MockOrderDocument implements Partial<OrderMongoDocument> {
  _id!: Types.ObjectId;
  qty!: number;
  recordId!: Types.ObjectId;
  created?: Date;
  lastModified?: Date;

  toObject() {
    return {
      _id: this._id,
      qty: this.qty,
      recordId: this.recordId,
      created: this.created,
      lastModified: this.lastModified,
    };
  }
}

export function createMockOrder(overrides: Partial<MockOrderDocument> = {}) {
  const doc = new MockOrderDocument();
  doc._id = overrides._id || new Types.ObjectId();
  doc.recordId = overrides.recordId || new Types.ObjectId();
  doc.qty = overrides.qty ?? 1;
  doc.created = overrides.created || new Date();
  doc.lastModified = overrides.lastModified || new Date();
  return doc as OrderMongoDocument;
}
