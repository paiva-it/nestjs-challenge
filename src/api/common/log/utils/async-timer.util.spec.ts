import { Logger } from '@nestjs/common';
import { asyncTimer } from './async-timer.util';

class MockLogger extends Logger {
  warnings: string[] = [];
  errors: string[] = [];
  logs: string[] = [];

  warn(message: string) {
    this.warnings.push(message);
  }
  error(message: string) {
    this.errors.push(message);
  }
  log(message: string) {
    this.logs.push(message);
  }
}

describe('asyncTimer', () => {
  let logger: MockLogger;
  beforeEach(() => {
    logger = new MockLogger();
  });

  it('returns function result', async () => {
    const result = await asyncTimer('test', async () => 'ok', logger, 1000);
    expect(result).toBe('ok');
    expect(logger.warnings).toHaveLength(0);
    expect(logger.errors).toHaveLength(0);
  });

  it('warns if execution > threshold', async () => {
    const result = await asyncTimer(
      'slowOp',
      async () => {
        await new Promise((res) => setTimeout(res, 30));
        return 'slow';
      },
      logger,
      10,
    );
    expect(result).toBe('slow');
    expect(logger.warnings).toHaveLength(1);
    expect(logger.warnings[0]).toMatch(/slowOp slow: \d+ms/);
    expect(logger.errors).toHaveLength(0);
  });

  it('logs error if promise rejects', async () => {
    await expect(
      asyncTimer(
        'failingOp',
        async () => {
          await new Promise((res) => setTimeout(res, 5));
          throw new Error('boom');
        },
        logger,
        50,
      ),
    ).rejects.toThrow('boom');
    expect(logger.errors).toHaveLength(1);
    expect(logger.errors[0]).toMatch(/failingOp failed after \d+ms: boom/);
  });

  it('does not log if below threshold', async () => {
    const result = await asyncTimer(
      'fastOp',
      async () => {
        return 'fast';
      },
      logger,
      100,
    );
    expect(result).toBe('fast');
    expect(logger.warnings).toHaveLength(0);
    expect(logger.errors).toHaveLength(0);
  });

  it('accepts a promise directly', async () => {
    const promise = new Promise<string>((res) =>
      setTimeout(() => res('done'), 5),
    );
    const result = await asyncTimer('directPromise', promise, logger, 10);
    expect(result).toBe('done');
    expect(logger.warnings).toHaveLength(0);
    expect(logger.errors).toHaveLength(0);
  });

  it('warns when direct promise is slow', async () => {
    const promise = new Promise<string>((res) =>
      setTimeout(() => res('slowPromise'), 25),
    );
    const result = await asyncTimer('slowDirect', promise, logger, 10);
    expect(result).toBe('slowPromise');
    expect(logger.warnings).toHaveLength(1);
    expect(logger.warnings[0]).toMatch(/slowDirect slow: \d+ms/);
  });
});
