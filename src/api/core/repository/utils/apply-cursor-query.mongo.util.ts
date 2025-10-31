import { FilterQuery, Types } from 'mongoose';
import { InvalidCursorException } from '../../pagination/exceptions/invalid-cursor.exception';

/**
 * Creates a new MongoDB query with cursor-based pagination applied (never mutates the original query).
 * @param query The original MongoDB query.
 * @param cursor The cursor value to paginate from.
 *
 * @throws InvalidCursorException if the provided cursor is not a valid ObjectId.
 *
 * @returns A new MongoDB query object with cursor pagination applied.
 */
export function applyCursorQueryMongo<T>(
  query: FilterQuery<T>,
  cursor?: string | null,
): FilterQuery<T> {
  if (!cursor) return { ...query };

  if (!Types.ObjectId.isValid(cursor)) {
    throw new InvalidCursorException(cursor);
  }

  return {
    ...query,
    _id: { $gt: new Types.ObjectId(cursor) },
  };
}
