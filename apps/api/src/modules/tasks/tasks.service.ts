import { Injectable } from '@nestjs/common';
import type { ListTasksQuery } from '@teamora/shared';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  async list(companyId: string, query: ListTasksQuery) {
    const from = new Date(query.from);
    const to = new Date(query.to);
    const tasks = await this.prisma.task.findMany({
      where: {
        companyId,
        dueAt: { not: null, gte: from, lte: to },
        ...(query.starred ? { starred: true } : {}),
      },
      include: {
        assignee: { select: { fullName: true, avatarUrl: true } },
      },
      orderBy: { dueAt: 'asc' },
    });

    return tasks.map((task) => ({
      id: task.id,
      title: task.title,
      dueAt: task.dueAt,
      assignee: task.assignee
        ? { fullName: task.assignee.fullName, avatarUrl: task.assignee.avatarUrl }
        : undefined,
    }));
  }
}
