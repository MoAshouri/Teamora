import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { CreateBonusLeaveInput, CreateLeaveRequestInput, ReviewLeaveInput } from '@teamora/shared';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthUser } from '../../common/auth/auth-user';

@Injectable()
export class LeavesService {
  constructor(private readonly prisma: PrismaService) {}

  create(companyId: string, userId: string, input: CreateLeaveRequestInput) {
    const startDate = new Date(input.startDate);
    const endDate = new Date(input.endDate);
    if (endDate < startDate) {
      throw new BadRequestException('endDate must be on/after startDate');
    }
    return this.prisma.leaveRequest.create({
      data: {
        companyId,
        userId,
        type: input.type,
        startDate,
        endDate,
        reason: input.reason,
      },
    });
  }

  list(user: AuthUser) {
    return this.prisma.leaveRequest.findMany({
      where: {
        companyId: user.companyId!,
        ...(user.role === 'EMPLOYEE' ? { userId: user.id } : {}),
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
    return this.prisma.leaveRequest.update({
      where: { id },
      data: {
        status: input.status,
        reviewNote: input.note,
        reviewedBy: adminId,
        reviewedAt: new Date(),
      },
    });
  }

  async grant(companyId: string, adminId: string, input: CreateBonusLeaveInput) {
    const membership = await this.prisma.companyMembership.findFirst({
      where: { companyId, userId: input.userId },
    });
    if (!membership) {
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

  async balance(companyId: string, userId: string) {
    const annualAllowanceDays = 12;
    const [approved, grants] = await Promise.all([
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
    ]);

    const usedDays = approved
      .filter((leave) => leave.kind === 'DAILY' && leave.type === 'ANNUAL')
      .reduce((sum, leave) => {
        const days =
          Math.floor((leave.endDate.getTime() - leave.startDate.getTime()) / 86_400_000) + 1;
        return sum + days;
      }, 0);
    const usedHours = approved
      .filter((leave) => leave.kind === 'HOURLY')
      .reduce((sum, leave) => sum + Number(leave.hours ?? 0), 0);
    const bonusDays = grants
      .filter((row) => row.kind === 'DAILY')
      .reduce((sum, row) => sum + Number(row.amount), 0);
    const bonusHours = grants
      .filter((row) => row.kind === 'HOURLY')
      .reduce((sum, row) => sum + Number(row.amount), 0);
    const remainingDays = annualAllowanceDays + bonusDays - usedDays;
    const remainingHours = bonusHours - usedHours;

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
