import { ConflictException } from '@nestjs/common';
import { Record } from '../schemas/record.schema';

export class RecordAlreadyExistsException extends ConflictException {
  constructor(record: Partial<Record>) {
    super(
      `Record already exists (artist: ${record.artist ?? '<unknown>'} / album: ${record.album ?? '<unknown>'} / format: ${record.format ?? '<unknown>'})`,
    );
  }
}
