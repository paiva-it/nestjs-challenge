import { FilterQuery, Types } from 'mongoose';

export function stringifyMongoQuery(input: FilterQuery<unknown>): string {
  const seen = new WeakSet();

  return JSON.stringify(
    input,
    (_, value) => {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return '[Circular]';
        }
        seen.add(value);
      }

      if (value instanceof Types.ObjectId) {
        return value.toString();
      }

      if (value instanceof Date) {
        return value.toISOString();
      }

      if (value instanceof RegExp) {
        return value.toString();
      }

      if (Array.isArray(value)) {
        return `[Array(${value.length})]`;
      }

      if (typeof value === 'bigint') {
        return value.toString();
      }

      if (typeof value === 'function') {
        return `[Function ${value.name}]`;
      }

      if (typeof value === 'symbol') {
        return value.toString();
      }

      return value;
    },
    2,
  );
}
