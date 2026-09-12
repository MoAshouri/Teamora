import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { CreateBonusLeaveInput, CreateLeaveRequestInput, ReviewLeaveInput } from '@teamora/shared';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthUser } from '../../common/auth/auth-user';

@Injectable()
export class LeavesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(companyId: string, userId: string, input: CreateLeaveRequestInput) {
    const startDate = new Date(`${input.startDate}T00:00:00.000Z`);
    const endDate = new Date(`${input.endDate}T00:00:00.000Z`);
    if (endDate < startDate) {
      throw new BadRequestException('endDate must be on/after startDate');
    }
    const kind = input.kind ?? 'DAILY';
    const hours = kind === 'HOURLY' ? input.hours : null;
    const pool = await this.balance(companyId, userId);
    const policy = await this.prisma.workPolicy.findUnique({ where: { companyId } });
    const dayHours = (policy?.dailyMinutes ?? 480) / 60;
    // #region agent log
    fetch('http://127.0.0.1:7869/ingest/c694b7eb-dcc2-4100-9c19-d4aca06d483e',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a506d6'},body:JSON.stringify({sessionId:'a506d6',runId:'post-fix',hypothesisId:'X',location:'leaves.service.ts:create',message:'leave create balance gate',data:{type:input.type,kind,hours,remainingHours:pool.remainingHours,remainingDays:pool.remainingDays,dayHours,usesBonusHours:input.type==='ANNUAL'&&kind==='HOURLY'},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    if (kind === 'HOURLY' && Number(hours ?? 0) > dayHours) {
      throw new BadRequestException('Hours exceed the work day');
    }
    if (input.type === 'ANNUAL') {
      const pending = await this.prisma.leaveRequest.findMany({
        where: {
          companyId,
          userId,
          status: 'PENDING',
          type: 'ANNUAL',
          source: 'REQUEST',
        },
      });
      const pendingHours = pending.reduce(
        (sum, row) => sum + this.leaveHours(row.kind, row.hours, row.startDate, row.endDate, dayHours),
        0,
      );
      const requestedHours =
        kind === 'HOURLY'
          ? Number(hours ?? 0)
          : this.leaveHours('DAILY', null, startDate, endDate, dayHours);
      // #region agent log
      fetch('http://127.0.0.1:7869/ingest/c694b7eb-dcc2-4100-9c19-d4aca06d483e',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a506d6'},body:JSON.stringify({sessionId:'a506d6',runId:'post-fix',hypothesisId:'RH',location:'leaves.service.ts:create:annualGate',message:'unified annual hour gate',data:{kind,requestedHours,pendingHours,remainingHours:pool.remainingHours,available:pool.remainingHours-pendingHours},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      if (requestedHours > pool.remainingHours) {
        throw new BadRequestException(
          kind === 'HOURLY' ? 'Insufficient leave hours' : 'Insufficient leave days',
        );
      }
    }
    return this.prisma.leaveRequest.create({
      data: {
        companyId,
        userId,
        type: input.type,
        kind,
        hours,
        startDate,
        endDate,
        reason: input.reason,
      },
    });
  }

  list(user: AuthUser, from?: string | Date, to?: string | Date) {
    const asDay = (value?: string | Date) => {
      if (!value) return undefined;
      if (value instanceof Date && !Number.isNaN(value.getTime())) {
        return value.toISOString().slice(0, 10);
      }
      const text = String(value);
      if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
      const parsed = new Date(text);
      return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString().slice(0, 10);
    };
    const fromDay = asDay(from);
    const toDay = asDay(to);
    const range =
      fromDay && toDay
        ? {
            startDate: { lte: new Date(`${toDay}T23:59:59.999Z`) },
            endDate: { gte: new Date(`${fromDay}T00:00:00.000Z`) },
          }
        : {};
    return this.prisma.leaveRequest.findMany({
      where: {
        companyId: user.companyId!,
        ...(user.role === 'EMPLOYEE' ? { userId: user.id } : {}),
        ...range,
      },
      include: {
        user: { select: { id: true, fullName: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  pending(companyId: string) {
    return this.prisma.leaveRequest.findMany({
      where: { companyId, status: 'PENDING' },
      include: {
        user: { select: { id: true, fullName: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async review(
    companyId: string,
    adminId: string,
    id: string,
    input: ReviewLeaveInput,
  ) {
    const leave = await this.prisma.leaveRequest.findFirst({
      where: { id, companyId },
    });
    if (!leave) throw new NotFoundException('Leave not found');
    if (leave.status !== 'PENDING') {
      throw new BadRequestException('Leave already reviewed');
    }
    // #region agent log
    fetch('http://127.0.0.1:7869/ingest/c694b7eb-dcc2-4100-9c19-d4aca06d483e',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a506d6'},body:JSON.stringify({sessionId:'a506d6',runId:'post-fix',hypothesisId:'S',location:'leaves.service.ts:review',message:'leave review status gate',data:{status:leave.status,next:input.status},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    const note = input.note.trim();
    if (!note) throw new BadRequestException('Review note is required');
    return this.prisma.leaveRequest.update({
      where: { id },
      data: {
        status: input.status,
        reviewNote: note,
        reviewedBy: adminId,
        reviewedAt: new Date(),
      },
    });
  }

  async grant(companyId: string, adminId: string, input: CreateBonusLeaveInput) {
    const membership = await this.prisma.companyMembership.findFirst({
      where: { companyId, userId: input.userId },
    });
    const company = await this.prisma.company.findFirst({
      where: { id: companyId, adminId: input.userId },
    });
    if (!membership && !company) {
      throw new ForbiddenException('Recipient not in company');
    }
    return this.prisma.leaveBalanceAdjustment.create({
      data: {
        companyId,
        userId: input.userId,
        kind: input.kind,
        amount: input.amount,
        note: input.note,
        createdBy: adminId,
      },
    });
  }

  private leaveHours(
    kind: string | null | undefined,
    hours: unknown,
    startDate: Date,
    endDate: Date,
    dayHours: number,
  ) {
    if (kind === 'HOURLY') return Number(hours ?? 0);
    const days = Math.floor((endDate.getTime() - startDate.getTime()) / 86_400_000) + 1;
    return days * dayHours;
  }

  async balance(companyId: string, userId: string) {
    const annualAllowanceDays = 12;
    const [approved, grants, policy, pending] = await Promise.all([
      this.prisma.leaveRequest.findMany({
        where: {
          companyId,
          userId,
          status: 'APPROVED',
          source: 'REQUEST',
        },
      }),
      this.prisma.leaveBalanceAdjustment.findMany({
        where: { companyId, userId },
      }),
      this.prisma.workPolicy.findUnique({ where: { companyId } }),
      this.prisma.leaveRequest.findMany({
        where: {
          companyId,
          userId,
          status: 'PENDING',
          type: 'ANNUAL',
          source: 'REQUEST',
        },
      }),
    ]);
    const dayHours = (policy?.dailyMinutes ?? 480) / 60;

    const usedDays = approved
      .filter((leave) => leave.kind === 'DAILY' && leave.type === 'ANNUAL')
      .reduce((sum, leave) => {
        const days =
          Math.floor((leave.endDate.getTime() - leave.startDate.getTime()) / 86_400_000) + 1;
        return sum + days;
      }, 0);
    const usedHours = approved
      .filter((leave) => leave.kind === 'HOURLY' && leave.type === 'ANNUAL')
      .reduce((sum, leave) => sum + Number(leave.hours ?? 0), 0);
    const bonusDays = grants
      .filter((row) => row.kind === 'DAILY')
      .reduce((sum, row) => sum + Number(row.amount), 0);
    const bonusHours = grants
      .filter((row) => row.kind === 'HOURLY')
      .reduce((sum, row) => sum + Number(row.amount), 0);
    const pendingHours = pending.reduce(
      (sum, row) => sum + this.leaveHours(row.kind, row.hours, row.startDate, row.endDate, dayHours),
      0,
    );
    const remainingHours =
      (annualAllowanceDays + bonusDays) * dayHours +
      bonusHours -
      usedDays * dayHours -
      usedHours -
      pendingHours;
    const remainingDays = dayHours > 0 ? remainingHours / dayHours : 0;
    // #region agent log
    fetch('http://127.0.0.1:7869/ingest/c694b7eb-dcc2-4100-9c19-d4aca06d483e',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a506d6'},body:JSON.stringify({sessionId:'a506d6',runId:'post-fix',hypothesisId:'RP',location:'leaves.service.ts:balance:pending',message:'remaining pool nets pending annual',data:{dayHours,usedDays,usedHours,pendingHours,pendingCount:pending.length,remainingDays,remainingHours},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    // #region agent log
    fetch('http://127.0.0.1:7869/ingest/c694b7eb-dcc2-4100-9c19-d4aca06d483e',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a506d6'},body:JSON.stringify({sessionId:'a506d6',runId:'post-fix',hypothesisId:'RH',location:'leaves.service.ts:balance',message:'unified remaining leave pool',data:{dayHours,usedDays,usedHours,bonusDays,bonusHours,remainingDays,remainingHours},timestamp:Date.now()})}).catch(()=>{});
    // #endregion

    return {
      annualAllowanceDays,
      annualAllowance: annualAllowanceDays,
      bonusDays,
      usedDays,
      remainingDays,
      bonusHours,
      usedHours,
      remainingHours,
      remaining: remainingDays,
      used: usedDays,
    };
  }
}
