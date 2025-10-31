import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class MockAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();

    const auth = req.headers['authorization'];
    if (!auth || auth !== 'Bearer mock-token') {
      throw new UnauthorizedException('Missing or invalid auth token');
    }

    req.user = {
      id: '123',
      role: 'ADMIN',
    };

    return true;
  }
}
