import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  getProfile(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        avatarUrl: true,
        createdAt: true,
      },
    });
  }

  async listCompanyEmployees(companyId: string) {
    const personSelect = {
      id: true,
      email: true,
      fullName: true,
      avatarUrl: true,
      activeSession: true,
      role: true,
    } as const;

    const [members, company] = await Promise.all([
      this.prisma.companyMembership.findMany({
        where: { companyId },
        include: { user: { select: personSelect } },
        orderBy: { joinedAt: 'asc' },
      }),
      this.prisma.company.findUnique({
        where: { id: companyId },
        include: { admin: { select: personSelect } },
      }),
    ]);

    const rows = members.map((row) => ({ user: row.user }));
    if (company?.admin && !rows.some((row) => row.user.id === company.admin.id)) {
      rows.unshift({ user: company.admin });
    }
    return rows;
  }
}
