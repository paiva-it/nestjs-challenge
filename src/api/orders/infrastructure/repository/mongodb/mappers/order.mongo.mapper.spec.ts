import { OrderMongoMapper } from './order.mongo.mapper';

describe('OrderMongoMapper', () => {
  let mapper: OrderMongoMapper;
  const base = {
    toObject: function () {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { toObject, version, ...rest } = this;
      return rest;
    },
  };

  beforeEach(() => {
    mapper = new OrderMongoMapper();
  });

  it('maps document to entity converting recordId to string', () => {
    const doc: any = {
      _id: 'mongo-id',
      recordId: { toString: () => 'rec-1' },
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
      ...base,
    };

    const entity = mapper.toEntity(doc);
    expect(entity.recordId).toBe('rec-1');
  });

  it('throws when recordId missing', () => {
    const doc: any = { _id: 'mongo-id', ...base };
    expect(() => mapper.toEntity(doc)).toThrow('recordId is missing');
  });
});
