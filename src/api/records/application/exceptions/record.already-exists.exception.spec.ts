import { RecordAlreadyExistsException } from './record.already-exists.exception';
import { ConflictException } from '@nestjs/common';
import { RecordFormat } from '../../domain/entities/record.enum';

describe('RecordAlreadyExistsException', () => {
  it('should extend ConflictException', () => {
    const err = new RecordAlreadyExistsException({
      artist: 'Artist',
      album: 'Album',
      format: RecordFormat.VINYL,
    });
    expect(err).toBeInstanceOf(ConflictException);
  });

  it('should include record details in message with fallbacks', () => {
    const err = new RecordAlreadyExistsException({});
    expect(err.message).toContain(
      'Record already exists (artist: <unknown> / album: <unknown> / format: <unknown>)',
    );
  });

  it('should interpolate provided fields', () => {
    const err = new RecordAlreadyExistsException({
      artist: 'A',
      album: 'B',
      format: RecordFormat.CD,
    });
    expect(err.message).toContain('artist: A / album: B / format: CD');
  });
});
