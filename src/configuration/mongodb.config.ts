import { registerAs } from '@nestjs/config';

export default registerAs('mongodb', () => ({
  uri: process.env.MONGO_URL,
  queryWarningThresholdMs: Number(process.env.MONGO_QUERY_WARNING_THRESHOLD_MS),
}));
