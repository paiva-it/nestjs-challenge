import { OrderService } from './order.service';
import { OrderRepositoryPort } from '../port/order.repository.port';
import { CreateOrderRequestDto } from '../dtos/create-order.request.dto';
import { InsufficientStockException } from '../exceptions/insufficient-stock.exception';
import {
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Order } from '../schemas/order.schema';

describe('OrderService', () => {
  let service: OrderService;
  let repository: jest.Mocked<OrderRepositoryPort>;

  beforeEach(() => {
    repository = {
      create: jest.fn(),
    } as unknown as jest.Mocked<OrderRepositoryPort>;

    service = new OrderService(repository);
  });

  const buildDto = (
    overrides: Partial<CreateOrderRequestDto> = {},
  ): CreateOrderRequestDto => ({
    recordId: '64a7b2f5c2a3f5e8d6e4b123',
    qty: 3,
    ...overrides,
  });

  it('delegates create to repository', async () => {
    const dto = buildDto();
    const order: Partial<Order> = {
      _id: 'o1',
      recordId: dto.recordId as any,
      qty: dto.qty,
    };
    repository.create.mockResolvedValue(order as Order);

    const result = await service.create(dto);

    expect(result).toEqual(order);
    expect(repository.create).toHaveBeenCalledWith(dto);
  });

  it('propagates InsufficientStockException', async () => {
    const dto = buildDto({ qty: 10 });
    repository.create.mockRejectedValue(
      new InsufficientStockException(dto.qty, 2),
    );
    await expect(service.create(dto)).rejects.toThrow(/Insufficient stock/);
  });

  it('propagates NotFoundException', async () => {
    const dto = buildDto();
    repository.create.mockRejectedValue(
      new NotFoundException('Record not found'),
    );
    await expect(service.create(dto)).rejects.toThrow(NotFoundException);
  });

  it('propagates InternalServerErrorException', async () => {
    const dto = buildDto();
    repository.create.mockRejectedValue(
      new InternalServerErrorException('Failed to create order'),
    );
    await expect(service.create(dto)).rejects.toThrow(
      InternalServerErrorException,
    );
  });
});
