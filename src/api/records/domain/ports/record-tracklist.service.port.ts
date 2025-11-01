import { RecordEntity, RecordEntityCore } from '../entities/record.entity';

export const RecordTracklistServicePort = Symbol('RecordTracklistServicePort');

export interface RecordTracklistServicePort {
  shouldUpdate(
    current: Partial<RecordEntity>,
    update: Partial<RecordEntityCore>,
  ): boolean;
  getTracklist(record: Partial<RecordEntity>): Promise<string[]>;
}
