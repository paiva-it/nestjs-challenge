import { Types } from 'mongoose';

export function stringifyUnknownVariable(input: unknown): string {
  const seen = new WeakSet();

  return JSON.stringify(
    input,
    (_, value) => {
      if (Types.ObjectId.isValid(value)) {
        return value.toString();
      }

      if (value instanceof Date) {
        return value.toISOString();
      }

      if (value instanceof RegExp) {
        return value.toString();
      }

      if (typeof value === 'bigint') {
        return `${value.toString()}n`;
      }

      if (typeof value === 'symbol') {
        return value.toString();
      }

      if (typeof value === 'function') {
        return `[Function ${value.name}]`;
      }

      if (Array.isArray(value)) {
        return `[Array(${value.length})]`;
      }

      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return '[Circular]';
        }
        seen.add(value);
      }

      return value;
    },
    2,
  );
}
