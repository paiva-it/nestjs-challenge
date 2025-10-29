import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test', 'staging')
    .default('development'),

  MONGO_URL: Joi.string()
    .uri({ scheme: [/mongodb/] })
    .required()
    .messages({
      'any.required': 'MONGO_URL is required',
      'string.uri': 'MONGO_URL must be a valid MongoDB URI',
    }),
  MONGO_QUERY_WARNING_THRESHOLD_MS: Joi.number()
    .integer()
    .positive()
    .default(100),

  HOST: Joi.string().hostname().default('0.0.0.0'),
  PORT: Joi.number().port().default(3000),

  PAGINATION_MAX_LIMIT: Joi.number()
    .integer()
    .positive()
    .max(1000)
    .empty('')
    .default(100),
  PAGINATION_DEFAULT_LIMIT: Joi.number()
    .integer()
    .positive()
    .max(Joi.ref('PAGINATION_MAX_LIMIT'))
    .empty('')
    .default(20),
});
