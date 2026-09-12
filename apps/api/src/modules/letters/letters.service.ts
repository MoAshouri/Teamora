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
    // #region agent log
    fetch('http://127.0.0.1:7869/ingest/c694b7eb-dcc2-4100-9c19-d4aca06d483e',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a506d6'},body:JSON.stringify({sessionId:'a506d6',runId:'post-fix',hypothesisId:'L1',location:'letters.service.ts:create',message:'letter recipient must be employee',data:{hasMembership:Boolean(membership),selfSend:input.recipientId===authorId},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    if (!membership) {
      throw new ForbiddenException('Recipient must be an employee');
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
