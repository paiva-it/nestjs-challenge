export class InsufficientStockException extends Error {
  constructor(stockRequested: number, stockAvailable: number) {
    super(
      `Insufficient stock: requested ${stockRequested}, available ${stockAvailable}`,
    );
  }
}
