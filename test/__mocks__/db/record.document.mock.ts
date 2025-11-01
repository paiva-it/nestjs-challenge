import { Types } from 'mongoose';
import { RecordMongoDocument } from '@api/records/infrastructure/repository/mongodb/schemas/record.mongo.schema';

export class MockRecordDocument implements Partial<RecordMongoDocument> {
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

export function createMockRecord(overrides: Partial<MockRecordDocument> = {}) {
  const doc = new MockRecordDocument();
  doc._id = overrides._id || new Types.ObjectId();
  doc.artist = overrides.artist || 'Artist';
  doc.album = overrides.album || 'Album';
  doc.qty = overrides.qty ?? 1;
  doc.searchTokens = overrides.searchTokens;
  return doc as RecordMongoDocument;
}
