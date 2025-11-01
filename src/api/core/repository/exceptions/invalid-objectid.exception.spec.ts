import { InvalidObjectIdException } from './invalid-objectid.exception';
import { BadRequestException } from '@nestjs/common';

describe('InvalidObjectIdException', () => {
  it('extends BadRequestException', () => {
    const err = new InvalidObjectIdException('abc');
    expect(err).toBeInstanceOf(BadRequestException);
    expect(err.message).toMatch(/Invalid ObjectId format/);
  });

  it('stringifies non-string values', () => {
    const err = new InvalidObjectIdException(123);
    expect(err.message).toContain("'123'");
  });
});
