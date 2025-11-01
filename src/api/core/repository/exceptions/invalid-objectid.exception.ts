import { BadRequestException } from '@nestjs/common';

export class InvalidObjectIdException extends BadRequestException {
  constructor(id: unknown) {
    super(`Invalid ObjectId format: '${String(id)}'`);
  }
}
