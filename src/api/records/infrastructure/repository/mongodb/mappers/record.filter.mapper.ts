import { SearchRecordQueryDto } from '@api/records/application/dtos/search-record.query.dto';
import { FilterQuery } from 'mongoose';
import { RecordMongoDocument } from '../schemas/record.mongo.schema';
import { normalizeString } from '@api/core/utils/normalize-string.util';

export function mapSearchDtoToMongoFilter(
  filters: SearchRecordQueryDto,
): FilterQuery<RecordMongoDocument> {
  const query: FilterQuery<RecordMongoDocument> = {};

  if (filters.artist) {
    query.artist = filters.artist.trim();
  }
  if (filters.album) {
    query.album = filters.album.trim();
  }
  if (filters.format) {
    query.format = filters.format.trim();
  }
  if (filters.category) {
    query.category = filters.category.trim();
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

  if (filters.q && filters.q.trim().length > 0) {
    const tokens = normalizeString(filters.q).split(' ');

    query.searchTokens = { $in: tokens };
  }

  return query;
}
