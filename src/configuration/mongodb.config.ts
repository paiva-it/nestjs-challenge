import { registerAs } from '@nestjs/config';

export default registerAs('mongodb', () => ({
  uri: process.env.MONGO_URL,
  queryWarningThresholdMs: Number(process.env.MONGO_QUERY_WARNING_THRESHOLD_MS),
}));

/**
 * Legacy export kept to avoid touching existing scripts relying on AppConfig.mongoUrl
 * @deprecated Use the 'mongodb' configuration namespace instead.
 */
export const MongoConfig = {
  mongoUrl: process.env.MONGO_URL,
};
