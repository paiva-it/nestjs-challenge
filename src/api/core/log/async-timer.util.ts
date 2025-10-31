import { Logger } from '@nestjs/common';
import { stringifyUnknownError } from './stringify-unkown-error.util';

export async function asyncTimer<T>(
  label: string,
  fnOrPromise: Promise<T> | (() => Promise<T>),
  logger: Logger,
  slowThresholdMs = 50,
): Promise<T> {
  const start = Date.now();

  const promise =
    typeof fnOrPromise === 'function' ? fnOrPromise() : fnOrPromise;

  try {
    const result = await promise;
    const duration = Date.now() - start;

    if (duration > slowThresholdMs) {
      logger.warn(`${label} slow: ${duration}ms`);
    }

    return result;
  } catch (err: unknown) {
    const duration = Date.now() - start;

    logger.error(
      `${label} failed after ${duration}ms: ${stringifyUnknownError(err)}`,
    );

    throw err;
  }
}
