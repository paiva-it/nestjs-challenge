import { OrderMongoMapper } from './order.mongo.mapper';
import { createMockOrder } from '@test/__mocks__/db/order.document.mock';
import { Types } from 'mongoose';

describe('OrderMongoMapper', () => {
  let mapper: OrderMongoMapper;

  beforeEach(() => {
    mapper = new OrderMongoMapper();
  });

  it('maps document to entity converting recordId to string', () => {
    const recordId = new Types.ObjectId();
    const doc = createMockOrder({ recordId });
    const entity = mapper.toEntity(doc as any);
    expect(entity.recordId).toBe(recordId.toString());
    expect(entity.id).toBe(doc._id.toString());
  });

  it('throws when recordId missing', () => {
    const doc: any = createMockOrder();
    delete doc.recordId;
    expect(() => mapper.toEntity(doc)).toThrow(
      'recordId is missing in OrderMongoDocument',
    );
  });
});
