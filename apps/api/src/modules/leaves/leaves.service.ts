import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { CreateLeaveRequestInput, ReviewLeaveInput } from '@teamora/shared';
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

  async balance(companyId: string, userId: string) {
    const annualAllowance = 12;
    const approved = await this.prisma.leaveRequest.findMany({
      where: {
        companyId,
        userId,
        type: 'ANNUAL',
        status: 'APPROVED',
      },
    });
    const used = approved.reduce((sum, l) => {
      const days =
        Math.floor(
          (l.endDate.getTime() - l.startDate.getTime()) / 86_400_000,
        ) + 1;
      return sum + days;
    }, 0);
    return { annualAllowance, used, remaining: Math.max(0, annualAllowance - used) };
  }
}
