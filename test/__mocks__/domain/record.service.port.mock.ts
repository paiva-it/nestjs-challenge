import { RecordEntity } from '@api/records/domain/entities/record.entity';
import { CreateRecordRequestDTO } from '@api/records/application/dtos/create-record.request.dto';
import { UpdateRecordRequestDTO } from '@api/records/application/dtos/update-record.request.dto';
import {
  RecordFormat,
  RecordCategory,
} from '@api/records/domain/entities/record.enum';

export function createRecordServicePortMock() {
  return {
    create: jest.fn(
      async (dto: CreateRecordRequestDTO) =>
        ({
          id: 'record-id',
          created: new Date('2024-01-01'),
          lastModified: new Date('2024-01-01'),
          artist: dto.artist || 'Artist',
          album: dto.album || 'Album',
          price: dto.price ?? 10,
          qty: dto.qty ?? 1,
          format: dto.format || RecordFormat.VINYL,
          category: dto.category || RecordCategory.ROCK,
          mbid: dto.mbid,
          tracklist: ['A', 'B'],
        }) as RecordEntity,
    ),
    update: jest.fn(
      async (id: string, update: UpdateRecordRequestDTO) =>
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
          tracklist: ['A', 'B'],
        }) as RecordEntity,
    ),
    findWithCursorPagination: jest.fn(async () => ({
      data: [],
      pageInfo: { cursor: null, remaining: 0 },
    })),
    findWithOffsetPagination: jest.fn(async () => ({
      data: [],
      pageInfo: { total: 0, page: 1, pageSize: 10 },
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
