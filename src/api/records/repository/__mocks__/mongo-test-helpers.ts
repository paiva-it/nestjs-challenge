import { FilterQuery } from 'mongoose';

export type TestRecord = {
  _id: string;
  artist: string;
};

export class QueryMock<T extends { _id: string }> {
  private data: T[];
  private limitValue?: number;
  private skipValue?: number;
  private sortConfig?: Record<string, 1 | -1>;

  constructor(data: T[]) {
    this.data = data;
  }

  sort(sortObj: Record<string, 1 | -1>): this {
    this.sortConfig = sortObj;
    return this;
  }

  limit(n: number): this {
    this.limitValue = n;
    return this;
  }

  skip(n: number): this {
    this.skipValue = n;
    return this;
  }

  lean(): this {
    return this;
  }

  async exec(): Promise<T[]> {
    let items = [...this.data];

    if (this.sortConfig?._id) {
      items.sort((a, b) => a._id.localeCompare(b._id));
    }

    if (this.skipValue !== undefined) {
      items = items.slice(this.skipValue);
    }

    if (this.limitValue !== undefined) {
      items = items.slice(0, this.limitValue);
    }

    return items;
  }
}

export function buildMockModel(docs: TestRecord[]): any {
  return {
    async create(record: any) {
      return record;
    },

    find(filter: FilterQuery<TestRecord>) {
      const filtered = docs.filter((doc) => {
        if ((filter as any)._id?.$gt) {
          return doc._id > (filter as any)._id?.$gt.toString();
        }
        return true;
      });
      return new QueryMock<TestRecord>(filtered);
    },

    countDocuments(filter: FilterQuery<TestRecord>) {
      const count = docs.filter((doc) => {
        if ((filter as any)._id?.$gt) {
          return doc._id > (filter as any)._id?.$gt.toString();
        }
        return true;
      }).length;
      return {
        exec: async () => count,
      };
    },
    findById(id: string) {
      const doc = docs.find((d) => d._id.toString() === id) || null;
      const mongooseDoc = doc && {
        ...doc,
        toObject: () => ({ ...doc }),
        set(update: any) {
          Object.assign(this, update);
          return this;
        },
        modifiedPaths() {
          return Object.keys(doc || {});
        },
        save: async () => ({ ...doc }),
      };
      return {
        session() {
          return this;
        },
        then(resolve: any, reject: any) {
          try {
            resolve(mongooseDoc);
          } catch (e) {
            reject(e);
          }
        },
      } as any;
    },

    findByIdAndUpdate(id: string, update: any) {
      return {
        async exec() {
          const existingIndex = docs.findIndex((d) => d._id.toString() === id);
          if (existingIndex === -1) return null;
          const merged = { ...docs[existingIndex], ...update };
          docs[existingIndex] = merged;
          return merged;
        },
      };
    },

    async startSession() {
      return {
        startTransaction() {},
        async commitTransaction() {},
        async abortTransaction() {},
        endSession() {},
        inTransaction() {
          return true;
        },
      };
    },
  };
}

export function oid(i: number): string {
  return i.toString().padStart(24, '0');
}
