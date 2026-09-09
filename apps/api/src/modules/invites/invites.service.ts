import { Injectable } from '@nestjs/common';
import type { CreateInviteInput } from '@teamora/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { CryptoService } from '../../common/crypto/crypto.service';

@Injectable()
export class InvitesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
  ) {}

  list(companyId: string) {
    return this.prisma.inviteCode.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(companyId: string, createdBy: string, opts: CreateInviteInput) {
    let code = this.crypto.generateInviteCode();
    for (let i = 0; i < 5; i++) {
      const exists = await this.prisma.inviteCode.findUnique({ where: { code } });
      if (!exists) break;
      code = this.crypto.generateInviteCode();
    }

    return this.prisma.inviteCode.create({
      data: {
        companyId,
        createdBy,
        code,
        maxUses: opts.maxUses,
        expiresAt: new Date(Date.now() + opts.expiresInHours * 3600_000),
      },
    });
  }
}
