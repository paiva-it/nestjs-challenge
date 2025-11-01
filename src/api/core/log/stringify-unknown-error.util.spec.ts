import { stringifyUnknownError } from './stringify-unknown-error.util';

describe('stringifyUnknownError', () => {
  it('returns stack trace when error has stack property', () => {
    const error = new Error('Test error message');
    error.stack = 'Error: Test error message\n    at test.js:1:1';

    const result = stringifyUnknownError(error);

    expect(result).toBe('Error: Test error message\n    at test.js:1:1');
  });

  it('returns message when error has no stack property', () => {
    const error = new Error('Test error message');
    error.stack = undefined;

    const result = stringifyUnknownError(error);

    expect(result).toBe('Test error message');
  });

  it('returns message when error has empty stack property', () => {
    const error = new Error('Test error message');
    error.stack = '';

    const result = stringifyUnknownError(error);

    expect(result).toBe('Test error message');
  });

  it('stringifies plain objects to JSON', () => {
    const errorObj = {
      code: 500,
      message: 'Internal server error',
      details: { field: 'value' },
    };

    const result = stringifyUnknownError(errorObj);

    expect(result).toBe(JSON.stringify(errorObj, null, 2));
  });

  it('stringifies arrays to JSON', () => {
    const errorArray = ['error1', 'error2', { code: 123 }];

    const result = stringifyUnknownError(errorArray);

    expect(result).toBe(JSON.stringify(errorArray, null, 2));
  });

  it('falls back to String() for objects with circular references', () => {
    const circularObj: any = { name: 'test' };
    circularObj.self = circularObj;

    const result = stringifyUnknownError(circularObj);

    expect(result).toBe('[object Object]');
  });

  it('handles primitive string values', () => {
    const result = stringifyUnknownError('simple error string');

    expect(result).toBe('"simple error string"');
  });

  it('handles primitive number values', () => {
    const result = stringifyUnknownError(42);

    expect(result).toBe('42');
  });

  it('handles primitive boolean values', () => {
    const result = stringifyUnknownError(true);

    expect(result).toBe('true');
  });

  it('handles null values', () => {
    const result = stringifyUnknownError(null);

    expect(result).toBe('null');
  });

  it('handles undefined values', () => {
    const result = stringifyUnknownError(undefined);

    expect(result).toBe('undefined');
  });

  it('handles functions by returning undefined (JSON.stringify behavior)', () => {
    const func = () => 'test';

    const result = stringifyUnknownError(func);

    expect(result).toBeUndefined();
  });

  it('handles Date objects', () => {
    const date = new Date('2023-01-01T00:00:00.000Z');

    const result = stringifyUnknownError(date);

    expect(result).toBe('"2023-01-01T00:00:00.000Z"');
  });

  it('handles custom error classes', () => {
    class CustomError extends Error {
      code: number;

      constructor(message: string, code: number) {
        super(message);
        this.name = 'CustomError';
        this.code = code;
      }
    }

    const customError = new CustomError('Custom error occurred', 500);

    const result = stringifyUnknownError(customError);

    expect(result).toContain('Custom error occurred');
  });

  it('handles objects that throw during JSON.stringify due to getters', () => {
    const problematicObj = {
      get badProperty() {
        throw new Error('Cannot access this property');
      },
      goodProperty: 'value',
    };

    const result = stringifyUnknownError(problematicObj);

    expect(result).toBe('[object Object]');
  });

  it('handles symbol values by returning undefined (JSON.stringify behavior)', () => {
    const symbol = Symbol('test');

    const result = stringifyUnknownError(symbol);

    expect(result).toBeUndefined();
  });

  it('handles BigInt values by throwing and falling back to String()', () => {
    const bigInt = BigInt(123456789012345678901234567890n);

    const result = stringifyUnknownError(bigInt);

    expect(result).toBe('123456789012345678901234567890');
  });

  it('prefers stack over message when both are present', () => {
    const error = new Error('Test message');
    error.stack = 'Full stack trace here';

    const result = stringifyUnknownError(error);

    expect(result).toBe('Full stack trace here');
    expect(result).not.toBe('Test message');
  });
});
