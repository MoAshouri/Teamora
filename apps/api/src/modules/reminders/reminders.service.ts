import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { CreateReminderInput, ExtendReminderInput } from '@teamora/shared';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthUser } from '../../common/auth/auth-user';

const DUE_STATUSES = ['ACTIVE', 'SNOOZED'] as const;

@Injectable()
export class RemindersService {
  constructor(private readonly prisma: PrismaService) {}

  private map(row: {
    id: string;
    targetKind: string;
    targetId: string | null;
    title: string;
    fireAt: Date;
    status: string;
    snoozeUntil: Date | null;
  }) {
    return {
      id: row.id,
      targetKind: row.targetKind,
      targetId: row.targetId,
      title: row.title,
      fireAt: row.fireAt.toISOString(),
      status: row.status,
      snoozeUntil: row.snoozeUntil?.toISOString() ?? null,
    };
  }

  private dueWhere(companyId: string, now: Date) {
    return {
      companyId,
      status: { in: [...DUE_STATUSES] },
      OR: [
        { snoozeUntil: { lte: now } },
        { snoozeUntil: null, fireAt: { lte: now } },
      ],
    };
  }

  private async assertTarget(companyId: string, kind: CreateReminderInput['targetKind'], targetId?: string | null) {
    if (kind === 'CUSTOM') return;
    if (!targetId) throw new BadRequestException('targetId is required');
    if (kind === 'TASK') {
      const task = await this.prisma.task.findFirst({ where: { id: targetId, companyId } });
      if (!task) throw new BadRequestException('Task not found');
      return;
    }
    if (kind === 'NOTE') {
      const note = await this.prisma.note.findFirst({ where: { id: targetId, companyId } });
      if (!note) throw new BadRequestException('Note not found');
      return;
    }
    const event = await this.prisma.calendarEvent.findFirst({ where: { id: targetId, companyId } });
    if (!event) throw new BadRequestException('Meeting not found');
  }

  async create(user: AuthUser, input: CreateReminderInput) {
    if (user.role !== 'ADMIN' && input.targetKind !== 'CUSTOM') {
      throw new ForbiddenException('Insufficient role');
    }
    await this.assertTarget(user.companyId!, input.targetKind, input.targetId);
    const reminder = await this.prisma.reminder.create({
      data: {
        companyId: user.companyId!,
        creatorId: user.id,
        targetKind: input.targetKind,
        targetId: input.targetKind === 'CUSTOM' ? null : input.targetId,
        title: input.title,
        fireAt: new Date(input.fireAt),
      },
    });
    return this.map(reminder);
  }

  async due(user: AuthUser) {
    const now = new Date();
    const base = this.dueWhere(user.companyId!, now);
    if (user.role === 'ADMIN') {
      const rows = await this.prisma.reminder.findMany({
        where: base,
        orderBy: { fireAt: 'asc' },
      });
      return rows.map((row) => this.map(row));
    }

    const [tasks, attending] = await Promise.all([
      this.prisma.task.findMany({
        where: { companyId: user.companyId!, assigneeId: user.id },
        select: { id: true },
      }),
      this.prisma.calendarAttendee.findMany({
        where: { userId: user.id, event: { companyId: user.companyId! } },
        select: { eventId: true },
      }),
    ]);

    const rows = await this.prisma.reminder.findMany({
      where: {
        companyId: user.companyId!,
        status: { in: [...DUE_STATUSES] },
        AND: [
          {
            OR: [
              { snoozeUntil: { lte: now } },
              { snoozeUntil: null, fireAt: { lte: now } },
            ],
          },
          {
            OR: [
              { targetKind: 'CUSTOM', creatorId: user.id },
              { targetKind: 'TASK', targetId: { in: tasks.map((row) => row.id) } },
              { targetKind: 'MEETING', targetId: { in: attending.map((row) => row.eventId) } },
            ],
          },
        ],
      },
      orderBy: { fireAt: 'asc' },
    });
    return rows.map((row) => this.map(row));
  }

  private async loadForActor(user: AuthUser, id: string) {
    const reminder = await this.prisma.reminder.findFirst({
      where: { id, companyId: user.companyId! },
    });
    if (!reminder) throw new NotFoundException('Reminder not found');
    if (user.role === 'ADMIN') return reminder;
    if (reminder.targetKind === 'CUSTOM' && reminder.creatorId === user.id) return reminder;
    if (reminder.targetKind === 'TASK' && reminder.targetId) {
      const task = await this.prisma.task.findFirst({
        where: { id: reminder.targetId, companyId: user.companyId!, assigneeId: user.id },
      });
      if (task) return reminder;
    }
    if (reminder.targetKind === 'MEETING' && reminder.targetId) {
      const seat = await this.prisma.calendarAttendee.findFirst({
        where: { eventId: reminder.targetId, userId: user.id },
      });
      if (seat) return reminder;
    }
    throw new ForbiddenException('Insufficient role');
  }

  async ack(user: AuthUser, id: string) {
    const reminder = await this.loadForActor(user, id);
    const updated = await this.prisma.reminder.update({
      where: { id: reminder.id },
      data: { status: 'ACKED' },
    });
    return this.map(updated);
  }

  async disable(user: AuthUser, id: string) {
    const reminder = await this.loadForActor(user, id);
    const updated = await this.prisma.reminder.update({
      where: { id: reminder.id },
      data: { status: 'DISABLED' },
    });
    return this.map(updated);
  }

  async extend(user: AuthUser, id: string, input: ExtendReminderInput) {
    const reminder = await this.loadForActor(user, id);
    const snoozeUntil = new Date(Date.now() + input.minutes * 60_000);
    const updated = await this.prisma.reminder.update({
      where: { id: reminder.id },
      data: { status: 'SNOOZED', snoozeUntil },
    });
    return this.map(updated);
  }
}
