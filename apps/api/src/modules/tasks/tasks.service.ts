import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { CreateTaskInput, ListTasksQuery, UpdateTaskInput } from '@teamora/shared';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthUser } from '../../common/auth/auth-user';

const personSelect = { id: true, fullName: true, avatarUrl: true } as const;

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  private map(task: {
    id: string;
    title: string;
    description: string | null;
    dueAt: Date | null;
    starred: boolean;
    assigneeId: string | null;
    assignee: { id: string; fullName: string; avatarUrl: string | null } | null;
  }) {
    return {
      id: task.id,
      title: task.title,
      description: task.description,
      dueAt: task.dueAt,
      starred: task.starred,
      assigneeId: task.assigneeId,
      assignee: task.assignee
        ? { id: task.assignee.id, fullName: task.assignee.fullName, avatarUrl: task.assignee.avatarUrl }
        : undefined,
    };
  }

  async list(user: AuthUser, query: ListTasksQuery) {
    const from = new Date(query.from);
    const to = new Date(query.to);
    const tasks = await this.prisma.task.findMany({
      where: {
        companyId: user.companyId!,
        AND: [
          {
            OR: [{ dueAt: null }, { dueAt: { gte: from, lte: to } }],
          },
          ...(query.starred ? [{ starred: true }] : []),
          ...(user.role === 'EMPLOYEE'
            ? [{ OR: [{ assigneeId: user.id }, { assigneeId: null }] }]
            : []),
        ],
      },
      include: {
        assignee: { select: personSelect },
      },
      orderBy: { dueAt: 'asc' },
    });
    // #region agent log
    fetch('http://127.0.0.1:7869/ingest/c694b7eb-dcc2-4100-9c19-d4aca06d483e',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a506d6'},body:JSON.stringify({sessionId:'a506d6',runId:'post-fix',hypothesisId:'T',location:'tasks.service.ts:list',message:'task list dueAt mix',data:{from:query.from,to:query.to,total:tasks.length,nullDue:tasks.filter((row)=>row.dueAt==null).length},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    return tasks.map((task) => this.map(task));
  }

  async create(companyId: string, creatorId: string, input: CreateTaskInput) {
    if (input.assigneeId) {
      await this.assertAssignee(companyId, input.assigneeId);
    }
    const task = await this.prisma.task.create({
      data: {
        companyId,
        creatorId,
        title: input.title,
        description: input.description,
        assigneeId: input.assigneeId ?? null,
        dueAt: input.dueAt ? new Date(input.dueAt) : null,
        starred: input.starred ?? false,
      },
      include: { assignee: { select: personSelect } },
    });
    return this.map(task);
  }

  async update(companyId: string, id: string, input: UpdateTaskInput) {
    const existing = await this.prisma.task.findFirst({ where: { id, companyId } });
    if (!existing) throw new NotFoundException('Task not found');
    if (input.assigneeId) {
      await this.assertAssignee(companyId, input.assigneeId);
    }
    const task = await this.prisma.task.update({
      where: { id },
      data: {
        ...(input.title != null ? { title: input.title } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.assigneeId !== undefined ? { assigneeId: input.assigneeId } : {}),
        ...(input.dueAt !== undefined ? { dueAt: input.dueAt ? new Date(input.dueAt) : null } : {}),
        ...(input.starred !== undefined ? { starred: input.starred } : {}),
      },
      include: { assignee: { select: personSelect } },
    });
    return this.map(task);
  }

  async delete(companyId: string, id: string) {
    const existing = await this.prisma.task.findFirst({ where: { id, companyId } });
    if (!existing) throw new NotFoundException('Task not found');
    await this.prisma.task.delete({ where: { id } });
  }

  private async assertAssignee(companyId: string, userId: string) {
    const member = await this.prisma.companyMembership.findFirst({
      where: { companyId, userId },
    });
    const company = await this.prisma.company.findFirst({
      where: { id: companyId, adminId: userId },
    });
    if (!member && !company) {
      throw new ForbiddenException('Assignee not in company');
    }
  }
}
