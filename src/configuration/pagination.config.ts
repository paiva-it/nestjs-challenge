import { registerAs } from '@nestjs/config';

export default registerAs('pagination', () => ({
  maxLimit: Number(process.env.PAGINATION_MAX_LIMIT),
  defaultLimit: Number(process.env.PAGINATION_DEFAULT_LIMIT),
}));
