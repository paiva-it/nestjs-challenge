import { registerAs } from '@nestjs/config';

export default registerAs('server', () => ({
  env: process.env.NODE_ENV,
  host: process.env.HOST,
  port: Number(process.env.PORT),
}));
