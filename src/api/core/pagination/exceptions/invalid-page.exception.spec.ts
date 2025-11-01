import { InvalidPageException } from './invalid-page.exception';
import { BadRequestException } from '@nestjs/common';

describe('InvalidPageException', () => {
  it('should extend BadRequestException', () => {
    const err = new InvalidPageException(0);
    expect(err).toBeInstanceOf(BadRequestException);
  });

  it('should include page number in message', () => {
    const page = 0;
    const err = new InvalidPageException(page);
    expect(err.message).toContain(
      `Invalid page number: ${page}. Page must be >= 1`,
    );
  });
});
