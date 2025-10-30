import { FilterQuery } from 'mongoose';
import { Record as RecordDoc } from '../../schemas/record.schema';

export function buildSession() {
  return {
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    abortTransaction: jest.fn(),
    endSession: jest.fn(),
  };
}

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

export function buildModelForCreate() {
  const mockDocument = {
    save: jest.fn(async function () {
      return this;
    }),
  };

  const model = jest.fn((dto) => {
    return Object.assign(Object.create(mockDocument), dto);
  }) as any;

  model.create = jest.fn(async (dto) => dto);
  return model;
}

export function buildModelForCreateWithError(error: any) {
  const mockDocument = {
    save: jest.fn(async function () {
      throw error;
    }),
  };
  const model = jest.fn((dto) => {
    return Object.assign(Object.create(mockDocument), dto);
  }) as any;
  return model;
}

export interface BuildModelForUpdateResult {
  model: any;
  doc: any;
  session: any;
}

export function buildModelForUpdate(
  initial: Partial<RecordDoc> & { _id: string },
  modifiedFields: string[],
): BuildModelForUpdateResult {
  const doc: any = {
    ...initial,
    set: jest.fn((update: Partial<RecordDoc>) => {
      Object.assign(doc, update);
    }),
    modifiedPaths: jest.fn(() => modifiedFields),
    toObject: jest.fn(() => ({ ...doc })),
    save: jest.fn(async () => doc),
    _id: initial._id,
    searchTokens: initial.searchTokens as string[] | undefined,
  };

  const session = buildSession();
  const model = {
    startSession: jest.fn().mockResolvedValue(session),
    findById: jest.fn().mockReturnValue({ session: () => doc }),
  } as any;
  return { model, doc, session };
}

export function buildMockTokenService() {
  return {
    needsRecompute: (paths: string[]) =>
      paths.some((p) => ['artist', 'album', 'category', 'format'].includes(p)),
    generate: jest.fn((doc: object) => {
      const r = doc as any;
      const raw = [r.artist, r.album, r.category, r.format]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return raw ? raw.split(/\s+/) : [];
    }),
  };
}
