import { registerAs } from '@nestjs/config';

export default registerAs('external', () => ({
  defaultTimeout: Number(process.env.EXTERNAL_DEFAULT_TIMEOUT),
  userAgent: process.env.EXTERNAL_USER_AGENT,
}));
