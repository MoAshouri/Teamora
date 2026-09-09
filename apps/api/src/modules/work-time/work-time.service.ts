import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { SubmitTimeEntryInput } from '@teamora/shared';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthUser } from '../../common/auth/auth-user';

@Injectable()
export class WorkTimeService {
  constructor(private readonly prisma: PrismaService) {}

  startSession(companyId: string, userId: string) {
    return this.prisma.activeWorkSession.upsert({
      where: { userId },
      create: { companyId, userId, startedAt: new Date() },
      update: { startedAt: new Date(), companyId },
    });
  }

  async endSession(companyId: string, userId: string) {
    const session = await this.prisma.activeWorkSession.findUnique({
      where: { userId },
    });
    if (!session || session.companyId !== companyId) {
      throw new NotFoundException('No active session');
    }

    const endedAt = new Date();
    const date = new Date(session.startedAt.toISOString().slice(0, 10));

    const [entry] = await this.prisma.$transaction([
      this.prisma.timeEntry.create({
        data: {
          companyId,
          userId,
          date,
          startedAt: session.startedAt,
          endedAt,
          status: 'PENDING',
        },
      }),
      this.prisma.activeWorkSession.delete({ where: { userId } }),
    ]);

    return entry;
  }

  getMySession(userId: string) {
    return this.prisma.activeWorkSession.findUnique({ where: { userId } });
  }

  listActiveSessions(companyId: string) {
    return this.prisma.activeWorkSession.findMany({
      where: { companyId },
      include: {
        user: {
          select: { id: true, fullName: true, avatarUrl: true, email: true },
        },
      },
      orderBy: { startedAt: 'asc' },
    });
  }

  submitEntry(companyId: string, userId: string, input: SubmitTimeEntryInput) {
    const startedAt = new Date(input.startedAt);
    const endedAt = new Date(input.endedAt);
    if (endedAt <= startedAt) {
      throw new BadRequestException('endedAt must be after startedAt');
    }
    return this.prisma.timeEntry.create({
      data: {
        companyId,
        userId,
        date: new Date(input.date),
        startedAt,
        endedAt,
        note: input.note,
        status: 'PENDING',
      },
    });
  }

  listEntries(user: AuthUser, from?: string, to?: string) {
    const where: Record<string, unknown> = { companyId: user.companyId! };
    if (user.role === 'EMPLOYEE') where.userId = user.id;
    if (from || to) {
      where.date = {
        ...(from ? { gte: new Date(from) } : {}),
        ...(to ? { lte: new Date(to) } : {}),
      };
    }
    return this.prisma.timeEntry.findMany({
      where,
      include: {
        user: { select: { id: true, fullName: true, avatarUrl: true } },
      },
      orderBy: { date: 'desc' },
    });
  }

  async reviewEntry(
    companyId: string,
    adminId: string,
    entryId: string,
    status: 'APPROVED' | 'REJECTED',
  ) {
    const entry = await this.prisma.timeEntry.findFirst({
      where: { id: entryId, companyId },
    });
    if (!entry) throw new NotFoundException('Entry not found');
    return this.prisma.timeEntry.update({
      where: { id: entryId },
      data: {
        status,
        reviewedBy: adminId,
        reviewedAt: new Date(),
      },
    });
  }

  async weeklyHours(companyId: string, userId?: string) {
    const now = new Date();
    const day = now.getUTCDay();
    // Week starts Saturday (6) for FA locale default
    const diffToSat = (day + 1) % 7;
    const start = new Date(now);
    start.setUTCDate(now.getUTCDate() - diffToSat);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setUTCDate(start.getUTCDate() + 6);
    end.setUTCHours(23, 59, 59, 999);

    if (userId) {
      const membership = await this.prisma.companyMembership.findFirst({
        where: { companyId, userId },
      });
      const admin = await this.prisma.company.findFirst({
        where: { id: companyId, adminId: userId },
      });
      if (!membership && !admin) {
        throw new ForbiddenException('User not in company');
      }
    }

    const entries = await this.prisma.timeEntry.findMany({
      where: {
        companyId,
        ...(userId ? { userId } : {}),
        date: { gte: start, lte: end },
        status: { in: ['PENDING', 'APPROVED'] },
      },
    });

    const byDay: Record<string, number> = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setUTCDate(start.getUTCDate() + i);
      byDay[d.toISOString().slice(0, 10)] = 0;
    }
    for (const e of entries) {
      const key = e.date.toISOString().slice(0, 10);
      const hours = (e.endedAt.getTime() - e.startedAt.getTime()) / 3_600_000;
      byDay[key] = (byDay[key] ?? 0) + hours;
    }

    return { from: start, to: end, hoursByDay: byDay };
  }
}
