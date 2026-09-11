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
  SetPasswordSchema,
  ChangePasswordSchema,
  VerifyOtpSchema,
  ChangeEmailSchema,
  ConfirmEmailVerifySchema,
  ConfirmEmailChangeSchema,
} from '@teamora/shared';
import type { Profile } from 'passport-google-oauth20';
import { PrismaService } from '../../prisma/prisma.service';
import { CryptoService } from '../../common/crypto/crypto.service';
import { RedisService } from '../../config/redis.module';
import { verificationFlags, type AuthUser } from '../../common/auth/auth-user';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly crypto: CryptoService,
    private readonly redis: RedisService,
  ) {}

  private toUser(user: {
    id: string;
    email: string;
    fullName: string;
    role: 'ADMIN' | 'EMPLOYEE';
    passwordHash: string | null;
    emailVerifiedAt: Date | null;
    pendingEmail: string | null;
    ownedCompany?: { id: string } | null;
    membership?: { companyId: string } | null;
  }): AuthUser {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      companyId:
        user.role === 'ADMIN'
          ? user.ownedCompany?.id ?? null
          : user.membership?.companyId ?? null,
      mustSetPassword: !user.passwordHash,
      ...verificationFlags(user),
    };
  }

  private async toAuthUser(userId: string): Promise<AuthUser> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { ownedCompany: true, membership: true },
    });
    return this.toUser(user);
  }

  private async uniqueUsername(email: string) {
    const base =
      email
        .split('@')[0]
        .replace(/[^a-zA-Z0-9]/g, '')
        .slice(0, 24) || 'user';
    let candidate = base;
    let n = 0;
    while (await this.prisma.user.findUnique({ where: { username: candidate } })) {
      n += 1;
      candidate = `${base}${n}`;
    }
    return candidate;
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
    const existing = await this.prisma.user.findUnique({ where: { email: input.email } });
    if (existing) throw new ConflictException('Email already used');

    const passwordHash = await this.crypto.hashPassword(input.password);
    const user = await this.prisma.user.create({
      data: {
        email: input.email,
        username: await this.uniqueUsername(input.email),
        fullName: input.fullName,
        passwordHash,
        role: 'ADMIN',
        ownedCompany: {
          create: { name: input.companyName },
        },
      },
      include: { ownedCompany: true, membership: true },
    });

    await this.prisma.workPolicy.create({
      data: {
        companyId: user.ownedCompany!.id,
        workStart: '09:00',
        workEnd: '18:00',
        workDays: [6, 0, 1, 2, 3],
        timezone: 'Asia/Tehran',
        dailyMinutes: 480,
        overtimeAfterMinutes: 480,
        flexInMinutes: 0,
        flexOutMinutes: 0,
      },
    });

    const token = this.signToken(user.id);
    await this.sendEmailVerificationCode(user.id, user.email);
    return { token, user: this.toUser(user) };
  }

  async loginPassword(raw: unknown) {
    const input = LoginPasswordSchema.parse(raw);
    const user = await this.prisma.user.findUnique({
      where: { email: input.email },
      include: { ownedCompany: true, membership: true },
    });
    if (!user?.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const ok = await this.crypto.verifyPassword(input.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    return {
      token: this.signToken(user.id),
      user: this.toUser(user),
    };
  }

  async requestOtp(raw: unknown) {
    const input = RequestOtpSchema.parse(raw);
    const email = input.email.toLowerCase();
    const code = this.crypto.generateOtpCode();
    await this.storeOtp(`otp:${email}`, code);
    await this.sendOtpMail(email, code, 'Teamora login code');
    return { ok: true };
  }

  async verifyOtp(raw: unknown) {
    const input = VerifyOtpSchema.parse(raw);
    const email = input.email.toLowerCase();
    await this.assertOtp(`otp:${email}`, input.code);

    const user = await this.prisma.user.findUnique({
      where: { email: input.email },
      include: { ownedCompany: true, membership: true },
    });
    if (!user) {
      throw new BadRequestException(
        'No account for this email. Register as admin or join with invite code first.',
      );
    }

    return {
      token: this.signToken(user.id),
      user: this.toUser(user),
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

    const existing = await this.prisma.user.findUnique({ where: { email: input.email } });
    if (existing) throw new ConflictException('Email already used');

    const username = await this.uniqueUsername(input.email);
    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email: input.email,
          username,
          fullName: input.fullName,
          passwordHash: null,
          role: 'EMPLOYEE',
          membership: {
            create: { companyId: invite.companyId },
          },
        },
        include: { ownedCompany: true, membership: true },
      });
      await tx.inviteCode.update({
        where: { id: invite.id },
        data: { usedCount: { increment: 1 } },
      });
      return created;
    });

    return {
      token: this.signToken(user.id),
      user: this.toUser(user),
    };
  }

  async setPassword(userId: string, raw: unknown) {
    const input = SetPasswordSchema.parse(raw);
    const existing = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!existing) throw new UnauthorizedException('User not found');
    if (existing.passwordHash) {
      throw new ConflictException('Password already set');
    }
    const passwordHash = await this.crypto.hashPassword(input.password);
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
      include: { ownedCompany: true, membership: true },
    });
    return this.toUser(user);
  }

  async changePassword(userId: string, raw: unknown) {
    const input = ChangePasswordSchema.parse(raw);
    const existing = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!existing?.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const ok = await this.crypto.verifyPassword(input.currentPassword, existing.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    const passwordHash = await this.crypto.hashPassword(input.newPassword);
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
      include: { ownedCompany: true, membership: true },
    });
    return this.toUser(user);
  }

  async loginOrLinkGoogle(profile: Profile) {
    const email = profile.emails?.[0]?.value;
    if (!email) throw new BadRequestException('Google account has no email');

    let user = await this.prisma.user.findFirst({
      where: {
        OR: [{ googleId: profile.id }, { email }],
      },
      include: { ownedCompany: true, membership: true },
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
          ...(!user.emailVerifiedAt && email.toLowerCase() === user.email.toLowerCase()
            ? { emailVerifiedAt: new Date() }
            : {}),
        },
        include: { ownedCompany: true, membership: true },
      });
    }

    return {
      token: this.signToken(user.id),
      user: this.toUser(user),
    };
  }

  async requestEmailVerify(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    await this.sendEmailVerificationCode(user.id, user.email);
    return { ok: true };
  }

  async confirmEmailVerify(userId: string, raw: unknown) {
    const input = ConfirmEmailVerifySchema.parse(raw);
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { ownedCompany: true, membership: true },
    });
    await this.assertOtp(`otp:verify:${user.id}:${user.email.toLowerCase()}`, input.code);
    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerifiedAt: new Date(),
        pendingEmail: null,
        pendingEmailRequestedAt: null,
      },
      include: { ownedCompany: true, membership: true },
    });
    return this.toUser(updated);
  }

  async requestEmailChange(userId: string, raw: unknown) {
    const input = ChangeEmailSchema.parse(raw);
    const newEmail = input.newEmail.toLowerCase();
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (newEmail === user.email.toLowerCase()) {
      throw new BadRequestException('Email is already current');
    }
    const taken = await this.prisma.user.findUnique({ where: { email: newEmail } });
    if (taken) throw new ConflictException('Email already used');

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        pendingEmail: newEmail,
        pendingEmailRequestedAt: new Date(),
      },
    });

    const code = this.crypto.generateOtpCode();
    await this.storeOtp(`otp:change:${userId}:${newEmail}`, code);
    await this.sendOtpMail(newEmail, code, 'Teamora email change code');
    return { ok: true };
  }

  async confirmEmailChange(userId: string, raw: unknown) {
    const input = ConfirmEmailChangeSchema.parse(raw);
    const newEmail = input.newEmail.toLowerCase();
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { ownedCompany: true, membership: true },
    });
    if (!user.pendingEmail || user.pendingEmail.toLowerCase() !== newEmail) {
      throw new BadRequestException('No matching pending email change');
    }
    await this.assertOtp(`otp:change:${userId}:${newEmail}`, input.code);

    const taken = await this.prisma.user.findUnique({ where: { email: newEmail } });
    if (taken && taken.id !== userId) throw new ConflictException('Email already used');

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        email: newEmail,
        emailVerifiedAt: new Date(),
        pendingEmail: null,
        pendingEmailRequestedAt: null,
      },
      include: { ownedCompany: true, membership: true },
    });
    return this.toUser(updated);
  }

  async me(userId: string) {
    return this.toAuthUser(userId);
  }

  private async sendEmailVerificationCode(userId: string, email: string) {
    const code = this.crypto.generateOtpCode();
    await this.storeOtp(`otp:verify:${userId}:${email.toLowerCase()}`, code);
    await this.sendOtpMail(email, code, 'Teamora email verification');
  }

  private async storeOtp(key: string, code: string) {
    await this.redis.connect();
    await this.redis.client.set(key, code, 'EX', 600);
  }

  private async assertOtp(key: string, code: string) {
    await this.redis.connect();
    const stored = await this.redis.client.get(key);
    if (!stored || stored !== code) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }
    await this.redis.client.del(key);
  }

  private async sendOtpMail(to: string, code: string, subject: string) {
    if (!process.env.SMTP_HOST) {
      // eslint-disable-next-line no-console
      console.log(`[OTP] ${to} => ${code}`);
      return;
    }
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
      to,
      subject,
      text: `Your code is ${code}`,
    });
  }
}
