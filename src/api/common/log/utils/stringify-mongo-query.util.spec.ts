import { stringifyUnkownVariable } from './stringify-mongo-query.util';
import { Types } from 'mongoose';

describe('stringifyMongoQuery', () => {
  it('safely stringifies circular objects', () => {
    const query: any = { a: 1 };
    query.self = query;
    const result = stringifyUnkownVariable(query);
    expect(result).toContain('"self": "[Circular]"');
  });

  it('redacts functions', () => {
    const fn = function testFn() {
      return 42;
    };
    const query = { handler: fn };
    const result = stringifyUnkownVariable(query);
    expect(result).toContain('[Function testFn]');
    expect(result).not.toContain('return 42');
  });

  it('serializes ObjectId correctly', () => {
    const id = new Types.ObjectId('507f1f77bcf86cd799439011');
    const result = stringifyUnkownVariable({ id });
    expect(result).toContain('"id": "507f1f77bcf86cd799439011"');
  });

  it('serializes Date correctly', () => {
    const date = new Date('2023-01-01T00:00:00.000Z');
    const result = stringifyUnkownVariable({ date });
    expect(result).toContain('"date": "2023-01-01T00:00:00.000Z"');
  });

  it('serializes Symbol, RegExp, BigInt and Arrays correctly', () => {
    const query = {
      sym: Symbol('test'),
      regex: /test/i,
      big: BigInt(10),
      arr: [1, 2, 3],
    };
    const result = stringifyUnkownVariable(query);
    expect(result).toContain('"sym": "Symbol(test)"');
    expect(result).toContain('"regex": "/test/i"');
    expect(result).toContain('"big": "10n"');
    expect(result).toContain('"arr": "[Array(3)]"');
  });

  it('handles nested objects', () => {
    const query = {
      level1: {
        level2: {
          name: 'nested',
          surname: 'object',
        },
      },
    };
    const result = stringifyUnkownVariable(query);
    expect(result).toContain('"name": "nested"');
    expect(result).toContain('"surname": "object"');
  });

  it('stable sorting for logs (deterministic output)', () => {
    const buildQuery = () => {
      return {
        z: 1,
        a: 2,
        m: { nested: true },
        array: [1, 2, 3],
      };
    };

    const q1 = buildQuery();
    const q2 = buildQuery();
    const r1 = stringifyUnkownVariable(q1);
    const r2 = stringifyUnkownVariable(q2);
    expect(r1).toBe(r2);
    expect(r1).toContain('"array": "[Array(3)]"');
  });
});
