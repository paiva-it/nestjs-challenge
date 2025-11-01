import { jest } from '@jest/globals';
export function createMongooseModelMock() {
  return {
    create: jest.fn(),
    find: jest.fn().mockReturnThis(),
    findOne: jest.fn().mockReturnThis(),
    findOneAndUpdate: jest.fn(),
    findById: jest.fn(),
    updateOne: jest.fn().mockReturnThis(),
    deleteOne: jest.fn().mockReturnThis(),
    exec: jest.fn(),
    aggregate: jest.fn().mockReturnThis(),
    lean: jest.fn().mockReturnThis(),
  } as unknown as jest.Mocked<any>;
}
