import {
  OrderEntity,
  OrderEntityCore,
} from '@api/orders/domain/entities/order.entity';

export function createOrderRepositoryPortMock() {
  return {
    create: jest.fn(
      async (order: Partial<OrderEntityCore>) =>
        ({
          id: 'order-id',
          created: new Date('2024-01-01'),
          lastModified: new Date('2024-01-01'),
          qty: order.qty ?? 1,
          recordId: order.recordId || 'record-id',
        }) as OrderEntity,
    ),
  } as any;
}
