import { Test, TestingModule } from '@nestjs/testing';
import { OrderController } from './order.controller';
import { OrderService } from '../services/order.service';
import { CreateOrderRequestDto } from '../dtos/create-order.request.dto';
import { InsufficientStockException } from '../exceptions/insufficient-stock.exception';
import {
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Order } from '../schemas/order.schema';

describe('OrderController', () => {
  let controller: OrderController;
  let service: OrderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrderController],
      providers: [
        {
          provide: OrderService,
          useValue: {
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<OrderController>(OrderController);
    service = module.get<OrderService>(OrderService);
  });

  const buildCreateDto = (
    overrides: Partial<CreateOrderRequestDto> = {},
  ): CreateOrderRequestDto => ({
    recordId: '64a7b2f5c2a3f5e8d6e4b123',
    qty: 2,
    ...overrides,
  });

  it('should create a new order', async () => {
    const dto = buildCreateDto();
    const savedOrder: Partial<Order> = {
      _id: 'abc123',
      recordId: dto.recordId as any,
      qty: dto.qty,
    } as Order;
    (service.create as jest.Mock).mockResolvedValue(savedOrder as Order);

    const result = await controller.create(dto);

    expect(result).toEqual(savedOrder);
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('propagates insufficient stock error from service', async () => {
    const dto = buildCreateDto({ qty: 10 });
    (service.create as jest.Mock).mockRejectedValue(
      new InsufficientStockException(dto.qty, 5),
    );

    await expect(controller.create(dto)).rejects.toThrow(/Insufficient stock/);
  });

  it('propagates not found error from service', async () => {
    const dto = buildCreateDto();
    (service.create as jest.Mock).mockRejectedValue(
      new NotFoundException('Record not found'),
    );

    await expect(controller.create(dto)).rejects.toThrow(NotFoundException);
  });

  it('propagates internal server error from service', async () => {
    const dto = buildCreateDto();
    (service.create as jest.Mock).mockRejectedValue(
      new InternalServerErrorException('Failed to create order'),
    );

    await expect(controller.create(dto)).rejects.toThrow(
      InternalServerErrorException,
    );
  });
});
