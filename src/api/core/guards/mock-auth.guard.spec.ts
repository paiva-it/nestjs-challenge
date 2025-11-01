import { MockAuthGuard } from './mock-auth.guard';
import { UnauthorizedException } from '@nestjs/common';
import { executionContextFactory } from '@test/__mocks__/framework/execution.context.factory.mock';

describe('MockAuthGuard', () => {
  let guard: MockAuthGuard;
  beforeEach(() => {
    guard = new MockAuthGuard();
  });

  it('allows when correct bearer token is provided', () => {
    const ctx = executionContextFactory({ authorization: 'Bearer mock-token' });
    const result = guard.canActivate(ctx);
    expect(result).toBe(true);
    const req = ctx.switchToHttp().getRequest();
    expect(req.user).toMatchObject({ id: '123', role: 'ADMIN' });
  });

  it('throws UnauthorizedException when header missing', () => {
    const ctx = executionContextFactory({});
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });

  it('throws UnauthorizedException when token invalid', () => {
    const ctx = executionContextFactory({ authorization: 'Bearer wrong' });
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });
});
