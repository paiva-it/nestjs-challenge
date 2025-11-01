import { OrderController } from '@api/orders/interface/order.controller';
import { OrderServicePort } from '@api/orders/domain/ports/order.service.port';
import { createOrderRepositoryPortMock } from '@test/__mocks__/domain/order.repository.port.mock';
import { createRecordServicePortMock } from '@test/__mocks__/domain/record.service.port.mock';
import { OrderService } from '@api/orders/application/services/order.service';
import { CreateOrderRequestDto } from '@api/orders/application/dtos/create-order.request.dto';
import { RecordServicePort } from '@api/records/domain/ports/record.service.port';

describe('OrderController', () => {
  let controller: OrderController;
  let service: OrderService;
  let orderRepositoryMock: ReturnType<typeof createOrderRepositoryPortMock>;
  let recordServiceMock: ReturnType<typeof createRecordServicePortMock>;

  beforeEach(() => {
    orderRepositoryMock = createOrderRepositoryPortMock();
    recordServiceMock = createRecordServicePortMock();
    service = new OrderService(
      orderRepositoryMock as any,
      recordServiceMock as any as RecordServicePort,
    );
    controller = new OrderController(service as any as OrderServicePort);
  });

  it('create should delegate to service and return created order', async () => {
    const dto: CreateOrderRequestDto = { qty: 3, recordId: 'rec-1' };
    const result = await controller.create(dto);
    expect(orderRepositoryMock.create).toHaveBeenCalledWith(dto);
    expect(result).toMatchObject({ id: 'order-id', qty: 3, recordId: 'rec-1' });
  });
});
