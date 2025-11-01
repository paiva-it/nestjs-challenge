import { createHash } from 'node:crypto';
import { stringifyUnknownVariable } from '../log/stringify-unknown-variable.util';

export function hash(input: unknown): string {
  const str =
    typeof input === 'string' ? input : stringifyUnknownVariable(input ?? '');

  return createHash('md5').update(str).digest('hex');
}
