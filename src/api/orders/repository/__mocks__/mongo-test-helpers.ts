import { OrderMongoRepository } from '../order.mongo.repository';
import { CreateOrderRequestDto } from '../../dtos/create-order.request.dto';
import { Logger } from '@nestjs/common';

export interface BuildRepositoryOptions {
  recordFindByIdImpl?: (id: string) => any;
  recordFindOneAndUpdateImpl?: (...args: any[]) => any;
  orderSaveImpl?: () => any;
}

export interface BuiltRepository {
  repo: OrderMongoRepository;
  session: any;
  recordModel: any;
  orderCtor: any;
}

export function buildSession() {
  return {
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    abortTransaction: jest.fn(),
    endSession: jest.fn(),
  };
}

export function buildRepository(
  options: BuildRepositoryOptions,
): BuiltRepository {
  const { recordFindByIdImpl, recordFindOneAndUpdateImpl, orderSaveImpl } =
    options;

  const session = buildSession();

  const recordModel = {
    findById: jest.fn((id: string) => ({
      session: () => (recordFindByIdImpl ? recordFindByIdImpl(id) : null),
    })),
    findOneAndUpdate: jest.fn(recordFindOneAndUpdateImpl || (() => null)),
  } as any;

  const orderModel = {
    startSession: jest.fn().mockResolvedValue(session),
  } as any;

  const orderCtor = jest.fn((dto: any) => ({
    ...dto,
    save: jest.fn(async () => (orderSaveImpl ? orderSaveImpl() : { ...dto })),
  }));
  Object.assign(orderCtor, orderModel);

  const repo = new OrderMongoRepository(
    orderCtor as any,
    recordModel as any,
    { uri: 'mock', queryWarningThresholdMs: 1000 } as any,
  );

  return { repo, session, recordModel, orderCtor };
}

export const buildDto = (
  overrides: Partial<CreateOrderRequestDto> = {},
): CreateOrderRequestDto => ({
  recordId: '64a7b2f5c2a3f5e8d6e4b123',
  qty: 2,
  ...overrides,
});

export function silenceLoggerErrors() {
  jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
}
