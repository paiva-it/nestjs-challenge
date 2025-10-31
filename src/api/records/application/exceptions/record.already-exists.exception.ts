import { RecordEntity } from '@api/records/domain/entities/record.entity';
import { ConflictException } from '@nestjs/common';

export class RecordAlreadyExistsException extends ConflictException {
  constructor(record: Partial<RecordEntity>) {
    super(
      `Record already exists (artist: ${record.artist ?? '<unknown>'} / album: ${record.album ?? '<unknown>'} / format: ${record.format ?? '<unknown>'})`,
    );
  }
}
