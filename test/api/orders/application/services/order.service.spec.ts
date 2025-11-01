import { OrderService } from '@api/orders/application/services/order.service';
import { CreateOrderRequestDto } from '@api/orders/application/dtos/create-order.request.dto';
import { OrderRepositoryPort } from '@api/orders/domain/ports/order.repository.port';
import { RecordServicePort } from '@api/records/domain/ports/record.service.port';
import { createOrderRepositoryPortMock } from '@test/__mocks__/domain/order.repository.port.mock';
import { createRecordServicePortMock } from '@test/__mocks__/domain/record.service.port.mock';

describe('OrderService', () => {
  let service: OrderService;
  let repositoryMock: ReturnType<typeof createOrderRepositoryPortMock>;
  let recordServiceMock: ReturnType<typeof createRecordServicePortMock>;

  beforeEach(() => {
    repositoryMock = createOrderRepositoryPortMock();
    recordServiceMock = createRecordServicePortMock();
    service = new OrderService(
      repositoryMock as any as OrderRepositoryPort,
      recordServiceMock as any as RecordServicePort,
    );
  });

  it('create should decrease record quantity then persist order', async () => {
    const dto: CreateOrderRequestDto = { qty: 2, recordId: 'record-123' };

    const result = await service.create(dto);

    expect(recordServiceMock.decreaseQuantity).toHaveBeenCalledWith(
      'record-123',
      2,
    );
    expect(repositoryMock.create).toHaveBeenCalledWith(dto);
    expect(result).toMatchObject({
      id: 'order-id',
      qty: 2,
      recordId: 'record-123',
    });
  });
});
