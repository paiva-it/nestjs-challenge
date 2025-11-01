import {
  RecordCategory,
  RecordFormat,
} from '../../../../domain/entities/record.enum';
import { mapSearchDtoToMongoFilter } from './record.filter.mapper';

describe('mapSearchDtoToMongoFilter', () => {
  it('builds equality filters correctly', () => {
    const filters = {
      artist: ' The Beatles ',
      album: ' Abbey Road ',
      format: RecordFormat.VINYL,
      category: RecordCategory.ROCK,
    };
    const query = mapSearchDtoToMongoFilter(filters);
    expect(query).toMatchObject({
      artist: 'The Beatles',
      album: 'Abbey Road',
      format: RecordFormat.VINYL,
      category: RecordCategory.ROCK,
    });
  });

  it('handles price_gte / price_lte', () => {
    const query = mapSearchDtoToMongoFilter({
      price_gte: 10,
      price_lte: 50,
    });
    expect(query.price).toEqual({ $gte: 10, $lte: 50 });
  });

  it('handles qty_gte / qty_lte', () => {
    const query = mapSearchDtoToMongoFilter({ qty_gte: 5, qty_lte: 25 });
    expect(query.qty).toEqual({ $gte: 5, $lte: 25 });
  });

  it('handles multiple filters combined', () => {
    const filters = {
      artist: ' Radiohead ',
      price_gte: 15,
      price_lte: 30,
      qty_gte: 2,
      qty_lte: 10,
      format: RecordFormat.CD,
    };
    const query = mapSearchDtoToMongoFilter(filters);
    expect(query.artist).toBe('Radiohead');
    expect(query.price).toEqual({ $gte: 15, $lte: 30 });
    expect(query.qty).toEqual({ $gte: 2, $lte: 10 });
    expect(query.format).toBe(RecordFormat.CD);
  });

  it('adds $in tokens for q', () => {
    const query = mapSearchDtoToMongoFilter({ q: '\n  Dark \t  Side   \t' });
    expect(query.searchTokens).toBeDefined();
    expect(query.searchTokens).toMatchObject({ $in: ['dark', 'side'] });
  });

  it('trims whitespace robustly', () => {
    const query = mapSearchDtoToMongoFilter({ artist: '\n  Nirvana\t  ' });
    expect(query.artist).toBe('Nirvana');
  });
});
