import { FilterQuery } from 'mongoose';
import { RecordEntity } from '@api/records/domain/entities/record.entity';
import { hash } from '@api/core/utils/hash.utils';

function stableObject(obj: unknown): unknown {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(stableObject);
  return Object.fromEntries(
    Object.entries(obj)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([k, v]) => [k, stableObject(v)]),
  );
}

export function recordCacheKey(id: string): string {
  return `record:${id}`;
}

export function searchCacheKey(query: FilterQuery<RecordEntity>): string {
  const normalized = stableObject(query);
  return `record:search:${hash(normalized)}`;
}
