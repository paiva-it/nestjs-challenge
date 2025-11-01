import { RecordMongoMapper } from './record.mongo.mapper';
import { Types } from 'mongoose';
import { RecordMongoDocument } from '../schemas/record.mongo.schema';

class MockRecordDocument implements Partial<RecordMongoDocument> {
  _id!: Types.ObjectId;
  searchTokens?: string[];
  artist?: string;
  album?: string;
  qty?: number;

  toObject() {
    return {
      _id: this._id,
      searchTokens: this.searchTokens,
      artist: this.artist,
      album: this.album,
      qty: this.qty,
    };
  }
}

describe('RecordMongoMapper', () => {
  let mapper: RecordMongoMapper;

  beforeEach(() => {
    mapper = new RecordMongoMapper();
  });

  it('maps `_id` to `id` and removes searchTokens', () => {
    const doc = new MockRecordDocument();
    doc._id = new Types.ObjectId();
    doc.artist = 'Nirvana';
    doc.album = 'Nevermind';
    doc.qty = 10;
    doc.searchTokens = ['nir', 'nirv'];

    const result = mapper.toEntity(doc as RecordMongoDocument);

    expect(result.id).toBe(doc._id.toString());
    expect(result.artist).toBe('Nirvana');
    expect(result.album).toBe('Nevermind');
    expect(result.qty).toBe(10);
    expect((result as any).searchTokens).toBeUndefined();
  });

  it('preserves all other properties returned by MongoMapper', () => {
    const doc = new MockRecordDocument();
    doc._id = new Types.ObjectId();
    doc.artist = 'Metallica';
    doc.album = 'Black Album';
    doc.qty = 5;

    const result = mapper.toEntity(doc as RecordMongoDocument);

    expect(result).toMatchObject({
      artist: 'Metallica',
      album: 'Black Album',
      qty: 5,
    });
  });

  it('throws if passed invalid document', () => {
    expect(() => mapper.toEntity(undefined as any)).toThrow();
    expect(() => mapper.toEntity(null as any)).toThrow();
  });

  it('throws if _id is missing', () => {
    const doc = new MockRecordDocument();
    doc._id = undefined;

    expect(() => mapper.toEntity(doc as any)).toThrow(
      'document._id is missing',
    );
  });

  it('throws if document.toObject is not a function', () => {
    const broken: any = { _id: new Types.ObjectId() };

    expect(() => mapper.toEntity(broken)).toThrow(
      'document.toObject is not a function',
    );
  });
});
