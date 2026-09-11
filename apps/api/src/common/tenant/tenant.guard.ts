import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import type { AuthUser } from '../auth/auth-user';

/** Ensures authenticated user has a company context. */
@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ user?: AuthUser; url?: string; method?: string }>();
    // #region agent log
    fetch('http://127.0.0.1:7869/ingest/c694b7eb-dcc2-4100-9c19-d4aca06d483e',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a506d6'},body:JSON.stringify({sessionId:'a506d6',runId:'pre-fix',hypothesisId:'B',location:'tenant.guard.ts:canActivate',message:'tenant access without email gate',data:{method:request.method,url:request.url,role:request.user?.role??null,mustVerifyEmail:request.user?.mustVerifyEmail??null,emailVerified:request.user?.emailVerified??null,hasCompany:Boolean(request.user?.companyId)},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    if (!request.user?.companyId) {
      throw new ForbiddenException('Company context required');
    }
    if (request.user.role === 'ADMIN' && request.user.mustVerifyEmail) {
      throw new ForbiddenException('Email verification required');
    }
    return true;
  }
}
