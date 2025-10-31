export interface TransactionManager<Ctx = unknown> {
  runInTransaction<T>(fn: () => Promise<T>): Promise<T>;
  getContext(): Ctx | null;
}

export const TX_MANAGER = Symbol('TX_MANAGER');
