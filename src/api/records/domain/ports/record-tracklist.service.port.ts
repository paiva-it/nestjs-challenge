import { RecordEntity, RecordEntityCore } from '../entities/record.entity';

export const RecordTracklistServicePort = Symbol('RecordTracklistServicePort');

export interface RecordTracklistServicePort {
  shouldRefetch(
    current: Partial<RecordEntity>,
    update: Partial<RecordEntityCore>,
  ): boolean;
  fetchTracklist(record: Partial<RecordEntity>): Promise<string[]>;
}
