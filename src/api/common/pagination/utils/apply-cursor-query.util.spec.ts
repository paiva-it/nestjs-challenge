import { applyCursorQuery } from './apply-cursor-query.util';
import { InvalidCursorException } from '../exceptions/invalid-cursor.exception';
import { Types } from 'mongoose';

describe('applyCursorQuery', () => {
  const baseQuery = { artist: 'Miles Davis' } as const;

  it('does nothing when cursor missing', () => {
    const result = applyCursorQuery(baseQuery, undefined);
    expect(result).toEqual(baseQuery);
  });

  it('returns a new object without mutating the input', () => {
    const undefinedResult = applyCursorQuery(baseQuery, undefined);
    const nullResult = applyCursorQuery(baseQuery, null);
    const result = applyCursorQuery(baseQuery, new Types.ObjectId().toString());
    expect(undefinedResult).not.toBe(baseQuery);
    expect(nullResult).not.toBe(baseQuery);
    expect(result).not.toBe(baseQuery);
    expect(baseQuery).not.toHaveProperty('_id');
  });

  it('adds $gt filter when cursor present', () => {
    const cursor = new Types.ObjectId().toString();
    const result = applyCursorQuery(baseQuery, cursor);
    expect(result).toHaveProperty('_id');
    expect(result._id).toHaveProperty('$gt');
    expect(result._id.$gt).toBeInstanceOf(Types.ObjectId);
  });

  it('rejects invalid ObjectId', () => {
    expect(() => applyCursorQuery(baseQuery, 'not-a-valid-objectid')).toThrow(
      InvalidCursorException,
    );
  });
});
