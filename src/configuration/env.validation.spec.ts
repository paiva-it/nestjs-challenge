import { validationSchema } from './env.validation';

describe('env.validation (Joi schema)', () => {
  const baseValidEnv = {
    MONGO_URL: 'mongodb://localhost:27017/test',
    REDIS_HOST: 'localhost',
  };

  it('validates a minimal valid configuration', () => {
    const { error, value } = validationSchema.validate(baseValidEnv);

    expect(error).toBeUndefined();
    expect(value.NODE_ENV).toBe('development');
    expect(value.REDIS_PORT).toBe(6379);
    expect(value.PAGINATION_DEFAULT_LIMIT).toBe(20);
    expect(value.PAGINATION_MAX_LIMIT).toBe(100);
  });

  it('fails when MONGO_URL is missing', () => {
    const env = { ...baseValidEnv };
    delete env.MONGO_URL;

    const { error } = validationSchema.validate(env);

    expect(error?.message).toContain('MONGO_URL is required');
  });

  it('fails when MONGO_URL is not mongodb:// scheme', () => {
    const env = { ...baseValidEnv, MONGO_URL: 'http://example.com' };

    const { error } = validationSchema.validate(env);

    expect(error?.message).toContain('MONGO_URL must be a valid MongoDB URI');
  });

  it('applies defaults correctly', () => {
    const { value } = validationSchema.validate(baseValidEnv);

    expect(value.NODE_ENV).toBe('development');
    expect(value.REDIS_PORT).toBe(6379);
    expect(value.PAGINATION_MAX_LIMIT).toBe(100);
    expect(value.PAGINATION_DEFAULT_LIMIT).toBe(20);
    expect(value.EXTERNAL_DEFAULT_TIMEOUT).toBe(5000);
  });

  it('accepts NODE_ENV values from allowed list', () => {
    const { error } = validationSchema.validate({
      ...baseValidEnv,
      NODE_ENV: 'production',
    });
    expect(error).toBeUndefined();
  });

  it('rejects invalid NODE_ENV', () => {
    const { error } = validationSchema.validate({
      ...baseValidEnv,
      NODE_ENV: 'invalid_env',
    });
    expect(error?.message).toContain('must be one of');
  });

  it('rejects negative max limit', () => {
    const env = { ...baseValidEnv, PAGINATION_MAX_LIMIT: -10 };
    const { error } = validationSchema.validate(env);
    expect(error).toBeDefined();
  });

  it('ensures PAGINATION_DEFAULT_LIMIT <= PAGINATION_MAX_LIMIT', () => {
    const env = {
      ...baseValidEnv,
      PAGINATION_MAX_LIMIT: 50,
      PAGINATION_DEFAULT_LIMIT: 100,
    };

    const { error } = validationSchema.validate(env);

    expect(error).toBeDefined();
  });

  it('treats empty-string as undefined (empty() rule)', () => {
    const env = {
      ...baseValidEnv,
      MONGO_URL: 'mongodb://localhost:27017/test',
      PAGINATION_DEFAULT_LIMIT: '',
    };

    const { error, value } = validationSchema.validate(env);
    expect(error).toBeUndefined();
    expect(value.PAGINATION_DEFAULT_LIMIT).toBe(20);
  });

  it('accepts custom EXTERNAL_USER_AGENT override', () => {
    const env = {
      ...baseValidEnv,
      EXTERNAL_USER_AGENT: 'CustomAgent/2.0',
    };

    const { value } = validationSchema.validate(env);
    expect(value.EXTERNAL_USER_AGENT).toBe('CustomAgent/2.0');
  });

  it('defaults EXTERNAL_USER_AGENT properly', () => {
    const { value } = validationSchema.validate(baseValidEnv);
    expect(value.EXTERNAL_USER_AGENT).toBe('BrokenRecordStore/1.0');
  });
});
