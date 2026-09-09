import { Injectable, NotFoundException } from '@nestjs/common';
import type { UpsertWorkPolicyInput } from '@teamora/shared';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CompaniesService {
  constructor(private readonly prisma: PrismaService) {}

  async getCompany(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      include: {
        workPolicy: true,
        _count: { select: { memberships: true } },
      },
    });
    if (!company) throw new NotFoundException('Company not found');
    return company;
  }

  getWorkPolicy(companyId: string) {
    return this.prisma.workPolicy.findUnique({ where: { companyId } });
  }

  upsertWorkPolicy(companyId: string, input: UpsertWorkPolicyInput) {
    return this.prisma.workPolicy.upsert({
      where: { companyId },
      create: {
        companyId,
        workStart: input.workStart,
        workEnd: input.workEnd,
        workDays: input.workDays,
        timezone: input.timezone ?? 'Asia/Tehran',
        dailyMinutes: input.dailyMinutes ?? 480,
        overtimeAfterMinutes: input.overtimeAfterMinutes ?? 480,
        flexInMinutes: input.flexInMinutes ?? 0,
        flexOutMinutes: input.flexOutMinutes ?? 0,
      },
      update: {
        workStart: input.workStart,
        workEnd: input.workEnd,
        workDays: input.workDays,
        timezone: input.timezone ?? 'Asia/Tehran',
        ...(input.dailyMinutes != null ? { dailyMinutes: input.dailyMinutes } : {}),
        ...(input.overtimeAfterMinutes != null
          ? { overtimeAfterMinutes: input.overtimeAfterMinutes }
          : {}),
        ...(input.flexInMinutes != null ? { flexInMinutes: input.flexInMinutes } : {}),
        ...(input.flexOutMinutes != null ? { flexOutMinutes: input.flexOutMinutes } : {}),
      },
    });
  }
}
