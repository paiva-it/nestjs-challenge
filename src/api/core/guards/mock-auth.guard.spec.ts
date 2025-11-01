import { MockAuthGuard } from './mock-auth.guard';
import { UnauthorizedException } from '@nestjs/common';

function createContext(headers: Record<string, string | undefined>) {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ headers, user: { id: '123', role: 'ADMIN' } }),
    }),
  } as any;
}

describe('MockAuthGuard', () => {
  let guard: MockAuthGuard;
  beforeEach(() => {
    guard = new MockAuthGuard();
  });

  it('allows when correct bearer token is provided', () => {
    const ctx = createContext({ authorization: 'Bearer mock-token' });
    const result = guard.canActivate(ctx);
    expect(result).toBe(true);
    const req = ctx.switchToHttp().getRequest();
    expect(req.user).toMatchObject({ id: '123', role: 'ADMIN' });
  });

  it('throws UnauthorizedException when header missing', () => {
    const ctx = createContext({});
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });

  it('throws UnauthorizedException when token invalid', () => {
    const ctx = createContext({ authorization: 'Bearer wrong' });
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });
});
