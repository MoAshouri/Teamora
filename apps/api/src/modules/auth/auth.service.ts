import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  JoinCompanySchema,
  LoginPasswordSchema,
  RegisterAdminSchema,
  RequestOtpSchema,
  VerifyOtpSchema,
} from '@teamora/shared';
import type { Profile } from 'passport-google-oauth20';
import { PrismaService } from '../../prisma/prisma.service';
import { CryptoService } from '../../common/crypto/crypto.service';
import { RedisService } from '../../config/redis.module';
import type { AuthUser } from '../../common/auth/auth-user';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly crypto: CryptoService,
    private readonly redis: RedisService,
  ) {}

  private async toAuthUser(userId: string): Promise<AuthUser> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { ownedCompany: true, membership: true },
    });
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      companyId:
        user.role === 'ADMIN'
          ? user.ownedCompany?.id ?? null
          : user.membership?.companyId ?? null,
    };
  }

  signToken(userId: string): string {
    return this.jwt.sign(
      { sub: userId },
      {
        secret: process.env.JWT_SECRET ?? 'dev-secret',
        expiresIn: (process.env.JWT_EXPIRES_IN ?? '7d') as `${number}d`,
      },
    );
  }

  async registerAdmin(raw: unknown) {
    const input = RegisterAdminSchema.parse(raw);
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: input.email }, { username: input.username }],
      },
    });
    if (existing) throw new ConflictException('Email or username already used');

    const passwordHash = await this.crypto.hashPassword(input.password);
    const user = await this.prisma.user.create({
      data: {
        email: input.email,
        username: input.username,
        fullName: input.fullName,
        passwordHash,
        role: 'ADMIN',
        ownedCompany: {
          create: { name: input.companyName },
        },
      },
      include: { ownedCompany: true },
    });

    await this.prisma.workPolicy.create({
      data: {
        companyId: user.ownedCompany!.id,
        workStart: '09:00',
        workEnd: '18:00',
        workDays: [6, 0, 1, 2, 3],
        timezone: 'Asia/Tehran',
      },
    });

    const token = this.signToken(user.id);
    return { token, user: await this.toAuthUser(user.id) };
  }

  async loginPassword(raw: unknown) {
    const input = LoginPasswordSchema.parse(raw);
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: input.identifier }, { username: input.identifier }],
      },
    });
    if (!user?.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const ok = await this.crypto.verifyPassword(input.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    return {
      token: this.signToken(user.id),
      user: await this.toAuthUser(user.id),
    };
  }

  async requestOtp(raw: unknown) {
    const input = RequestOtpSchema.parse(raw);
    await this.redis.connect();
    const code = this.crypto.generateOtpCode();
    const key = `otp:${input.email.toLowerCase()}`;
    await this.redis.client.set(key, code, 'EX', 600);

    // Dev-friendly: log OTP when SMTP is not configured
    if (!process.env.SMTP_HOST) {
      // eslint-disable-next-line no-console
      console.log(`[OTP] ${input.email} => ${code}`);
    } else {
      const nodemailer = await import('nodemailer');
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT ?? 587),
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
      await transporter.sendMail({
        from: process.env.SMTP_FROM ?? 'noreply@teamora.app',
        to: input.email,
        subject: 'Teamora login code',
        text: `Your code is ${code}`,
      });
    }

    return { ok: true };
  }

  async verifyOtp(raw: unknown) {
    const input = VerifyOtpSchema.parse(raw);
    await this.redis.connect();
    const key = `otp:${input.email.toLowerCase()}`;
    const stored = await this.redis.client.get(key);
    if (!stored || stored !== input.code) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }
    await this.redis.client.del(key);

    let user = await this.prisma.user.findUnique({ where: { email: input.email } });
    if (!user) {
      throw new BadRequestException(
        'No account for this email. Register as admin or join with invite code first.',
      );
    }

    return {
      token: this.signToken(user.id),
      user: await this.toAuthUser(user.id),
    };
  }

  async joinCompany(raw: unknown) {
    const input = JoinCompanySchema.parse(raw);
    const invite = await this.prisma.inviteCode.findUnique({
      where: { code: input.inviteCode },
    });
    if (!invite) throw new BadRequestException('Invalid invite code');
    if (invite.expiresAt && invite.expiresAt < new Date()) {
      throw new BadRequestException('Invite code expired');
    }
    if (invite.usedCount >= invite.maxUses) {
      throw new BadRequestException('Invite code already used');
    }

    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: input.email }, { username: input.username }],
      },
    });
    if (existing) throw new ConflictException('Email or username already used');

    const passwordHash = await this.crypto.hashPassword(input.password);
    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email: input.email,
          username: input.username,
          fullName: input.fullName,
          passwordHash,
          role: 'EMPLOYEE',
          membership: {
            create: { companyId: invite.companyId },
          },
        },
      });
      await tx.inviteCode.update({
        where: { id: invite.id },
        data: { usedCount: { increment: 1 } },
      });
      return created;
    });

    return {
      token: this.signToken(user.id),
      user: await this.toAuthUser(user.id),
    };
  }

  async loginOrLinkGoogle(profile: Profile) {
    const email = profile.emails?.[0]?.value;
    if (!email) throw new BadRequestException('Google account has no email');

    let user = await this.prisma.user.findFirst({
      where: {
        OR: [{ googleId: profile.id }, { email }],
      },
    });

    if (!user) {
      throw new BadRequestException(
        'No Teamora account linked. Register or join a company first, then connect Google.',
      );
    }

    if (!user.googleId) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: profile.id,
          avatarUrl: profile.photos?.[0]?.value,
        },
      });
    }

    return {
      token: this.signToken(user.id),
      user: await this.toAuthUser(user.id),
    };
  }

  async me(userId: string) {
    return this.toAuthUser(userId);
  }
}
