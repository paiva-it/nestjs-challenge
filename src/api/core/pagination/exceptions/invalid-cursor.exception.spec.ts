import { InvalidCursorException } from './invalid-cursor.exception';
import { BadRequestException } from '@nestjs/common';

describe('InvalidCursorException', () => {
  it('should extend BadRequestException', () => {
    const err = new InvalidCursorException('bad-cursor');
    expect(err).toBeInstanceOf(BadRequestException);
  });

  it('should include cursor value in message', () => {
    const cursor = 'bad-cursor';
    const err = new InvalidCursorException(cursor);
    expect(err.message).toContain(`Invalid cursor format: "${cursor}"`);
  });
});
