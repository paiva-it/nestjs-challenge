import { applyCursorQueryMongo } from './apply-cursor-query.mongo.util';
import { InvalidCursorException } from '../../pagination/exceptions/invalid-cursor.exception';
import { Types } from 'mongoose';

describe('applyCursorQueryMongo', () => {
  const baseQuery = { artist: 'Miles Davis' } as const;

  it('does nothing when cursor missing', () => {
    const result = applyCursorQueryMongo(baseQuery, undefined);
    expect(result).toEqual(baseQuery);
  });

  it('returns a new object without mutating the input', () => {
    const undefinedResult = applyCursorQueryMongo(baseQuery, undefined);
    const nullResult = applyCursorQueryMongo(baseQuery, null);
    const result = applyCursorQueryMongo(
      baseQuery,
      new Types.ObjectId().toString(),
    );
    expect(undefinedResult).not.toBe(baseQuery);
    expect(nullResult).not.toBe(baseQuery);
    expect(result).not.toBe(baseQuery);
    expect(baseQuery).not.toHaveProperty('_id');
  });

  it('adds $gt filter when cursor present', () => {
    const cursor = new Types.ObjectId().toString();
    const result = applyCursorQueryMongo(baseQuery, cursor);
    expect(result).toHaveProperty('_id');
    expect(result._id).toHaveProperty('$gt');
    expect(result._id.$gt).toBeInstanceOf(Types.ObjectId);
  });

  it('rejects invalid ObjectId', () => {
    expect(() =>
      applyCursorQueryMongo(baseQuery, 'not-a-valid-objectid'),
    ).toThrow(InvalidCursorException);
  });
});
