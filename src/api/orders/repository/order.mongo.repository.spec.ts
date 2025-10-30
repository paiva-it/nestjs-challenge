import { InsufficientStockException } from '../exceptions/insufficient-stock.exception';
import {
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  buildRepository,
  buildDto,
  silenceLoggerErrors,
} from './__mocks__/mongo-test-helpers';

describe('OrderMongoRepository.create', () => {
  beforeAll(() => {
    silenceLoggerErrors();
  });
  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('creates order and decrements record stock (success path)', async () => {
    const startingQty = 5;
    const dto = buildDto({ qty: 2 });
    const updatedRecord = { _id: dto.recordId, qty: startingQty - dto.qty };
    const { repo, session, recordModel, orderCtor } = buildRepository({
      recordFindOneAndUpdateImpl: jest.fn(() => updatedRecord),
      recordFindByIdImpl: jest.fn(() => updatedRecord),
    });

    const result = await repo.create(dto);

    expect(result).toBeDefined();
    expect(recordModel.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: dto.recordId, qty: { $gte: dto.qty } },
      { $inc: { qty: -dto.qty } },
      { session, new: true },
    );
    expect(session.startTransaction).toHaveBeenCalled();
    expect(session.commitTransaction).toHaveBeenCalled();
    expect(session.abortTransaction).not.toHaveBeenCalled();
    expect(session.endSession).toHaveBeenCalled();
    expect(orderCtor).toHaveBeenCalledWith(dto);
  });

  it('throws NotFoundException when record does not exist', async () => {
    const dto = buildDto();
    const { repo } = buildRepository({
      recordFindOneAndUpdateImpl: jest.fn(() => null),
      recordFindByIdImpl: jest.fn(() => null),
    });
    await expect(repo.create(dto)).rejects.toThrow(NotFoundException);
  });

  it('throws InsufficientStockException when record exists but insufficient qty', async () => {
    const dto = buildDto({ qty: 10 });
    const existingRecord = { _id: dto.recordId, qty: 3 };
    const { repo } = buildRepository({
      recordFindOneAndUpdateImpl: jest.fn(() => null),
      recordFindByIdImpl: jest.fn(() => existingRecord),
    });
    await expect(repo.create(dto)).rejects.toThrow(InsufficientStockException);
  });

  it('throws InternalServerErrorException when order save returns falsy', async () => {
    const dto = buildDto();
    const updatedRecord = { _id: dto.recordId, qty: 1 };
    const { repo } = buildRepository({
      recordFindOneAndUpdateImpl: jest.fn(() => updatedRecord),
      recordFindByIdImpl: jest.fn(() => updatedRecord),
      orderSaveImpl: () => null,
    });
    await expect(repo.create(dto)).rejects.toThrow(
      InternalServerErrorException,
    );
  });

  it('aborts transaction and rethrows unexpected error', async () => {
    const dto = buildDto();
    const unexpected = new Error('boom');
    const { repo, session } = buildRepository({
      recordFindOneAndUpdateImpl: jest.fn(() => {
        throw unexpected;
      }),
    });
    await expect(repo.create(dto)).rejects.toThrow(/boom/);
    expect(session.abortTransaction).toHaveBeenCalled();
    expect(session.commitTransaction).not.toHaveBeenCalled();
  });
});
