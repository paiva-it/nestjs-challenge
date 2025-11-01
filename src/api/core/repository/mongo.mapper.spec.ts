import { MongoMapper } from './mongo.mapper';
import { Document, Types } from 'mongoose';

class MockDocument implements Partial<Document> {
  _id!: Types.ObjectId;
  data: any;
  toObject() {
    return { _id: this._id, ...this.data };
  }
}

type MockData = {
  [key: string]: any;
};

describe('MongoMapper', () => {
  const mapper = new MongoMapper<
    Document & MockData,
    { id: string } & MockData
  >();

  it('maps `_id` to `id` and spreads remaining fields', () => {
    const doc = new MockDocument();
    doc._id = new Types.ObjectId();
    doc.data = { name: 'test', qty: 5 };

    const result = mapper.toEntity(doc as any);

    expect(result.id).toBe(doc._id.toString());
    expect(result.name).toBe('test');
    expect(result.qty).toBe(5);
    expect(result._id).toBeUndefined();
  });

  it('throws when document is missing', () => {
    expect(() => mapper.toEntity(undefined as any)).toThrow(
      'document is missing',
    );
  });

  it('throws when _id is missing', () => {
    const doc = new MockDocument();
    doc.data = { name: 'bad' };
    doc._id = undefined;

    expect(() => mapper.toEntity(doc as any)).toThrow(
      'document._id is missing',
    );
  });

  it('throws when toObject is not a function', () => {
    const brokenDoc: any = {
      _id: new Types.ObjectId(),
      toObject: undefined,
    };

    expect(() => mapper.toEntity(brokenDoc)).toThrow(
      'document.toObject is not a function',
    );
  });

  it('works when toObject returns nested structures', () => {
    const doc = new MockDocument();
    doc._id = new Types.ObjectId();
    doc.data = {
      name: 'nested',
      meta: { info: true },
    };

    const result = mapper.toEntity(doc as any);

    expect(result.meta.info).toBe(true);
  });

  it('converts _id to string', () => {
    const doc = new MockDocument();
    doc._id = new Types.ObjectId();
    doc.data = {};

    const result = mapper.toEntity(doc as any);

    expect(typeof result.id).toBe('string');
  });
});
