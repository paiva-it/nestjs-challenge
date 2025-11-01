import { MongoMapper } from './mongo.mapper';
import { Document, Types } from 'mongoose';
import { MockRecordDocument } from '@test/__mocks__/db/record.document.mock';

function createDoc(data: any) {
  const doc = new MockRecordDocument() as any as Document & { data?: any };
  doc._id = new Types.ObjectId();
  doc.data = data;
  doc.toObject = () => ({ _id: doc._id, ...doc.data });
  return doc;
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
    const doc = createDoc({ name: 'test', qty: 5 });

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
    const doc: any = createDoc({ name: 'bad' });
    doc._id = undefined;

    expect(() => mapper.toEntity(doc as any)).toThrow(
      'document._id is missing',
    );
  });

  it('handles documents without toObject method', () => {
    const brokenDoc: any = {
      _id: new Types.ObjectId(),
      name: 'test',
      toObject: undefined,
    };

    const result = mapper.toEntity(brokenDoc);

    expect(result.id).toBe(brokenDoc._id.toString());
    expect(result.name).toBe('test');
    expect(result.toObject).toBeUndefined();
  });

  it('works when toObject returns nested structures', () => {
    const doc = createDoc({ name: 'nested', meta: { info: true } });

    const result = mapper.toEntity(doc as any);

    expect(result.meta.info).toBe(true);
  });

  it('converts _id to string', () => {
    const doc = createDoc({});

    const result = mapper.toEntity(doc as any);

    expect(typeof result.id).toBe('string');
  });
});
