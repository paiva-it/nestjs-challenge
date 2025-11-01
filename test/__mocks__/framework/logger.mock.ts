import { Logger } from '@nestjs/common';

export function silenceLogger() {
  jest.spyOn(Logger.prototype, 'error').mockImplementation();
  jest.spyOn(Logger.prototype, 'warn').mockImplementation();
  jest.spyOn(Logger.prototype, 'log').mockImplementation();
}

export function createLoggerMock() {
  return {
    warnings: [] as string[],
    errors: [] as string[],
    logs: [] as string[],
    warn: jest.fn(function (this: any, message: string) {
      this.warnings.push(message);
    }),
    error: jest.fn(function (this: any, message: string) {
      this.errors.push(message);
    }),
    log: jest.fn(function (this: any, message: string) {
      this.logs.push(message);
    }),
  } as any as Logger & {
    warnings: string[];
    errors: string[];
    logs: string[];
  };
}
