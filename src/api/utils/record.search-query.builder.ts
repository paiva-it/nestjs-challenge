import { FilterQuery } from 'mongoose';
import { SearchRecordQueryDto } from '../dtos/search-record.query.dto';
import { Record } from '../schemas/record.schema';

export function buildRecordSearchQuery(
  filters: SearchRecordQueryDto,
): FilterQuery<Record> {
  const query: FilterQuery<Record> = {};

  if (filters.artist) {
    query.artist = filters.artist;
  }
  if (filters.album) {
    query.album = filters.album;
  }
  if (filters.format) {
    query.format = filters.format;
  }
  if (filters.category) {
    query.category = filters.category;
  }

  if (filters.price_lte) {
    query.price = { ...query.price, $lte: filters.price_lte };
  }
  if (filters.price_gte) {
    query.price = { ...query.price, $gte: filters.price_gte };
  }

  if (filters.qty_lte) {
    query.qty = { ...query.qty, $lte: filters.qty_lte };
  }
  if (filters.qty_gte) {
    query.qty = { ...query.qty, $gte: filters.qty_gte };
  }

  if (filters.q) {
    query.$text = { $search: filters.q };
  }

  return query;
}
