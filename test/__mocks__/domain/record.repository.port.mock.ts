import {
  RecordEntity,
  RecordEntityCore,
} from '@api/records/domain/entities/record.entity';
import {
  RecordFormat,
  RecordCategory,
} from '@api/records/domain/entities/record.enum';

export function createRecordRepositoryPortMock() {
  return {
    create: jest.fn(
      async (record: Partial<RecordEntityCore>) =>
        ({
          id: 'record-id',
          created: new Date('2024-01-01'),
          lastModified: new Date('2024-01-01'),
          artist: record.artist || 'Artist',
          album: record.album || 'Album',
          price: record.price ?? 10,
          qty: record.qty ?? 1,
          format: record.format || RecordFormat.VINYL,
          category: record.category || RecordCategory.ROCK,
          mbid: record.mbid,
          tracklist: record.tracklist || ['A', 'B'],
        }) as RecordEntity,
    ),
    update: jest.fn(
      async (id: string, update: Partial<RecordEntityCore>) =>
        ({
          id,
          created: new Date('2024-01-01'),
          lastModified: new Date(),
          artist: update.artist || 'Artist',
          album: update.album || 'Album',
          price: update.price ?? 10,
          qty: update.qty ?? 1,
          format: update.format || RecordFormat.VINYL,
          category: update.category || RecordCategory.ROCK,
          mbid: update.mbid,
          tracklist: update.tracklist || ['A', 'B'],
        }) as RecordEntity,
    ),
    findById: jest.fn(
      async (id: string) =>
        ({
          id,
          created: new Date('2024-01-01'),
          lastModified: new Date('2024-01-01'),
          artist: 'Artist',
          album: 'Album',
          price: 10,
          qty: 2,
          format: RecordFormat.VINYL,
          category: RecordCategory.ROCK,
          mbid: 'mbid',
          tracklist: ['A', 'B'],
        }) as RecordEntity,
    ),
    findWithCursorPagination: jest.fn(async () => ({
      data: [
        {
          id: 'record-id',
          created: new Date('2024-01-01'),
          lastModified: new Date('2024-01-01'),
          artist: 'Artist',
          album: 'Album',
          price: 10,
          qty: 1,
          format: 'VINYL',
          category: 'ROCK',
          mbid: 'mbid',
          tracklist: ['A', 'B'],
        },
      ],
      pageInfo: { cursor: 'c1', remaining: 0 },
    })),
    findWithOffsetPagination: jest.fn(async () => ({
      data: [
        {
          id: 'record-id',
          created: new Date('2024-01-01'),
          lastModified: new Date('2024-01-01'),
          artist: 'Artist',
          album: 'Album',
          price: 10,
          qty: 1,
          format: 'VINYL',
          category: 'ROCK',
          mbid: 'mbid',
          tracklist: ['A', 'B'],
        },
      ],
      pageInfo: { total: 1, page: 1, pageSize: 10 },
    })),
    decreaseQuantity: jest.fn(
      async (id: string, qty: number) =>
        ({
          id,
          created: new Date('2024-01-01'),
          lastModified: new Date(),
          artist: 'Artist',
          album: 'Album',
          price: 10,
          qty,
          format: RecordFormat.VINYL,
          category: RecordCategory.ROCK,
          mbid: 'mbid',
          tracklist: ['A', 'B'],
        }) as RecordEntity,
    ),
  } as any;
}
