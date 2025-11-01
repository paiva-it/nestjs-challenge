import { InsufficientStockException } from './insufficient-stock.exception';

describe('InsufficientStockException', () => {
  it('should extend Error', () => {
    const err = new InsufficientStockException(5, 2);
    expect(err).toBeInstanceOf(Error);
  });

  it('should include stock numbers in message', () => {
    const requested = 10;
    const available = 8;
    const err = new InsufficientStockException(requested, available);
    expect(err.message).toBe(
      `Insufficient stock: requested ${requested}, available ${available}`,
    );
  });
});
