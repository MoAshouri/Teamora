import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { CreateLetterInput } from '@teamora/shared';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class LettersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(companyId: string, authorId: string, input: CreateLetterInput) {
    const membership = await this.prisma.companyMembership.findFirst({
      where: { companyId, userId: input.recipientId },
    });
    if (!membership) {
      throw new ForbiddenException('Recipient not in company');
    }

    return this.prisma.letter.create({
      data: {
        companyId,
        authorId,
        recipientId: input.recipientId,
        subject: input.subject,
        body: input.body,
      },
    });
  }

  listCompany(companyId: string) {
    return this.prisma.letter.findMany({
      where: { companyId },
      include: {
        recipient: { select: { id: true, fullName: true, email: true } },
        author: { select: { id: true, fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  inbox(companyId: string, recipientId: string) {
    return this.prisma.letter.findMany({
      where: { companyId, recipientId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markRead(companyId: string, recipientId: string, id: string) {
    const letter = await this.prisma.letter.findFirst({
      where: { id, companyId, recipientId },
    });
    if (!letter) throw new NotFoundException('Letter not found');
    return this.prisma.letter.update({
      where: { id },
      data: { readAt: new Date() },
    });
  }
}
