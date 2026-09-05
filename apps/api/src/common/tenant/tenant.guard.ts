import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import type { AuthUser } from '../auth/auth-user';

/** Ensures authenticated user has a company context. */
@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ user?: AuthUser }>();
    if (!request.user?.companyId) {
      throw new ForbiddenException('Company context required');
    }
    return true;
  }
}
