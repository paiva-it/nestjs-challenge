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
    find(filter: FilterQuery<TestRecord>) {
      const filtered = docs.filter((doc) => {
        if (filter._id?.$gt) {
          return doc._id > filter._id?.$gt.toString();
        }
        return true;
      });

      return new QueryMock<TestRecord>(filtered);
    },

    countDocuments(filter: FilterQuery<TestRecord>) {
      const count = docs.filter((doc) => {
        if (filter._id?.$gt) {
          return doc._id > filter._id?.$gt.toString();
        }
        return true;
      }).length;

      return {
        exec: async () => count,
      };
    },
  };
}

export function oid(i: number): string {
  return i.toString().padStart(24, '0');
}
