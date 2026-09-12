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

  async startSession(companyId: string, userId: string) {
    const existing = await this.prisma.activeWorkSession.findUnique({ where: { userId } });
    // #region agent log
    fetch('http://127.0.0.1:7869/ingest/c694b7eb-dcc2-4100-9c19-d4aca06d483e',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a506d6'},body:JSON.stringify({sessionId:'a506d6',runId:'pre-fix',hypothesisId:'J',location:'work-time.service.ts:startSession',message:'session start existing',data:{hasExisting:Boolean(existing),existingStartedAt:existing?.startedAt?.toISOString?.()??null,sameCompany:existing?.companyId===companyId},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    if (existing) {
      return existing;
    }
    return this.prisma.activeWorkSession.create({
      data: { companyId, userId, startedAt: new Date() },
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
    const timeZone = await this.policyTimezone(companyId);
    const dateKey = this.zonedYmd(session.startedAt, timeZone);
    // #region agent log
    fetch('http://127.0.0.1:7869/ingest/c694b7eb-dcc2-4100-9c19-d4aca06d483e',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a506d6'},body:JSON.stringify({sessionId:'a506d6',runId:'post-fix',hypothesisId:'M',location:'work-time.service.ts:endSession',message:'session date tz',data:{utc:session.startedAt.toISOString().slice(0,10),zoned:dateKey,timeZone},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    const date = new Date(`${dateKey}T00:00:00.000Z`);

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

  async listEntries(user: AuthUser, from?: string, to?: string) {
    const where: Record<string, unknown> = { companyId: user.companyId! };
    if (user.role === 'EMPLOYEE') where.userId = user.id;
    if (from || to) {
      where.date = {
        ...(from ? { gte: new Date(from) } : {}),
        ...(to ? { lte: new Date(to) } : {}),
      };
    }
    const rows = await this.prisma.timeEntry.findMany({
      where,
      include: {
        user: { select: { id: true, fullName: true, avatarUrl: true } },
      },
      orderBy: { date: 'desc' },
    });
    rows.sort((a, b) => {
      if (a.status === 'PENDING' && b.status !== 'PENDING') return -1;
      if (a.status !== 'PENDING' && b.status === 'PENDING') return 1;
      return b.date.getTime() - a.date.getTime();
    });
    // #region agent log
    fetch('http://127.0.0.1:7869/ingest/c694b7eb-dcc2-4100-9c19-d4aca06d483e',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a506d6'},body:JSON.stringify({sessionId:'a506d6',runId:'post-fix',hypothesisId:'AQ',location:'work-time.service.ts:listEntries',message:'entries pending first',data:{count:rows.length,first:rows[0]?.status??null,pending:rows.filter((row)=>row.status==='PENDING').length},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    return rows;
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
    if (entry.status !== 'PENDING') {
      throw new BadRequestException('Entry already reviewed');
    }
    return this.prisma.timeEntry.update({
      where: { id: entryId },
      data: {
        status,
        reviewedBy: adminId,
        reviewedAt: new Date(),
      },
    });
  }

  private async policyTimezone(companyId: string) {
    const policy = await this.prisma.workPolicy.findUnique({ where: { companyId } });
    return policy?.timezone || 'Asia/Tehran';
  }

  private zonedYmd(value: Date, timeZone: string) {
    try {
      return new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(value);
    } catch {
      return value.toISOString().slice(0, 10);
    }
  }

  private addDaysYmd(ymd: string, days: number) {
    const date = new Date(`${ymd}T12:00:00.000Z`);
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().slice(0, 10);
  }

  private async saturdayWeekWindow(companyId: string, now = new Date()) {
    const timeZone = await this.policyTimezone(companyId);
    const today = this.zonedYmd(now, timeZone);
    const weekday = new Date(`${today}T12:00:00.000Z`).getUTCDay();
    const diffToSat = (weekday + 1) % 7;
    const startYmd = this.addDaysYmd(today, -diffToSat);
    const endYmd = this.addDaysYmd(startYmd, 6);
    const start = new Date(`${startYmd}T00:00:00.000Z`);
    const end = new Date(`${endYmd}T23:59:59.999Z`);
    const emptyDay: Record<string, number> = {};
    for (let i = 0; i < 7; i++) {
      emptyDay[this.addDaysYmd(startYmd, i)] = 0;
    }
    return { start, end, emptyDay };
  }

  async weeklyHours(companyId: string, userId?: string) {
    const { start, end, emptyDay } = await this.saturdayWeekWindow(companyId);

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

    const byDay = { ...emptyDay };
    for (const e of entries) {
      const key = e.date.toISOString().slice(0, 10);
      const hours = (e.endedAt.getTime() - e.startedAt.getTime()) / 3_600_000;
      byDay[key] = (byDay[key] ?? 0) + hours;
    }

    return { from: start, to: end, hoursByDay: byDay };
  }

  async weeklyHoursByPerson(companyId: string) {
    const { start, end, emptyDay } = await this.saturdayWeekWindow(companyId);
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      include: { memberships: { select: { userId: true } } },
    });
    const userIds = new Set<string>([
      ...(company?.memberships.map((row) => row.userId) ?? []),
      ...(company?.adminId ? [company.adminId] : []),
    ]);

    const entries = await this.prisma.timeEntry.findMany({
      where: {
        companyId,
        date: { gte: start, lte: end },
        status: { in: ['PENDING', 'APPROVED'] },
      },
    });

    const hours = new Map<string, Record<string, number>>();
    for (const id of userIds) hours.set(id, { ...emptyDay });
    for (const e of entries) {
      if (!hours.has(e.userId)) hours.set(e.userId, { ...emptyDay });
      const byDay = hours.get(e.userId)!;
      const key = e.date.toISOString().slice(0, 10);
      const value = (e.endedAt.getTime() - e.startedAt.getTime()) / 3_600_000;
      byDay[key] = (byDay[key] ?? 0) + value;
    }

    return {
      from: start,
      to: end,
      people: [...hours.entries()].map(([userId, hoursByDay]) => ({ userId, hoursByDay })),
    };
  }
}
