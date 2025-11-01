import { OrderMongoRepository } from './order.mongo.repository';
import { OrderMongoMapper } from './mappers/order.mongo.mapper';
import { createMongooseModelMock } from '@test/__mocks__/db/mongoose.model.mock';
import { Logger } from '@nestjs/common';

describe('OrderMongoRepository', () => {
  let repository: OrderMongoRepository;
  let model: ReturnType<typeof createMongooseModelMock>;

  beforeEach(() => {
    model = createMongooseModelMock();
    repository = new OrderMongoRepository(model as any);
  });

  beforeAll(() => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  it('creates and maps order correctly', async () => {
    const fakeDoc = {
      _id: 'abc123',
      qty: 2,
      recordId: 'rec001',
      createdAt: new Date('2025-01-01T00:00:00Z'),
      updatedAt: new Date('2025-01-02T00:00:00Z'),
    };

    model.create.mockResolvedValue(fakeDoc);

    const mapperSpy = jest
      .spyOn(OrderMongoMapper.prototype, 'toEntity')
      .mockReturnValue({
        id: 'abc123',
        qty: 2,
        recordId: 'rec001',
        created: new Date('2025-01-01T00:00:00Z'),
        lastModified: new Date('2025-01-02T00:00:00Z'),
      });

    const payload = { qty: 2, recordId: 'rec001' };

    const result = await repository.create(payload);

    expect(model.create).toHaveBeenCalledWith(payload);
    expect(mapperSpy).toHaveBeenCalledWith(fakeDoc);
    expect(result).toEqual({
      id: 'abc123',
      qty: 2,
      recordId: 'rec001',
      created: new Date('2025-01-01T00:00:00Z'),
      lastModified: new Date('2025-01-02T00:00:00Z'),
    });
  });

  it('logs and rethrows on create failure', async () => {
    model.create.mockRejectedValue(new Error('DB fail'));

    await expect(
      repository.create({ qty: 1, recordId: 'rec001' }),
    ).rejects.toThrow('DB fail');
  });
});
