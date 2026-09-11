import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { verificationFlags, type AuthUser } from '../../common/auth/auth-user';

type JwtPayload = { sub: string };

function cookieExtractor(req: Request): string | null {
  if (req?.cookies?.access_token) return req.cookies.access_token as string;
  return null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        cookieExtractor,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? 'dev-secret',
    });
  }

  async validate(payload: JwtPayload): Promise<AuthUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        ownedCompany: true,
        membership: true,
      },
    });
    if (!user) {
      // #region agent log
      fetch('http://127.0.0.1:7869/ingest/c694b7eb-dcc2-4100-9c19-d4aca06d483e',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a506d6'},body:JSON.stringify({sessionId:'a506d6',runId:'post-fix',hypothesisId:'U',location:'jwt.strategy.ts:validate',message:'missing user jwt',data:{hasSub:Boolean(payload.sub)},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      throw new UnauthorizedException('User not found');
    }

    const companyId =
      user.role === 'ADMIN'
        ? user.ownedCompany?.id ?? null
        : user.membership?.companyId ?? null;

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      companyId,
      mustSetPassword: !user.passwordHash,
      ...verificationFlags(user),
    };
  }
}
