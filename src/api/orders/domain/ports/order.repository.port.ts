import { OrderEntity, OrderEntityCore } from '../entities/order.entity';

export const OrderRepositoryPort = Symbol('ORDER_REPOSITORY_PORT');

export interface OrderRepositoryPort {
  create(order: Partial<OrderEntityCore>): Promise<OrderEntity>;
}
