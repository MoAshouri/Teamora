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

  listCompanyEmployees(companyId: string) {
    return this.prisma.companyMembership.findMany({
      where: { companyId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            avatarUrl: true,
            activeSession: true,
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });
  }
}
