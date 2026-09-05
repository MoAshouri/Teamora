import { BadRequestException, Injectable } from '@nestjs/common';
import type { CreateCalendarEventInput } from '@teamora/shared';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CalendarService {
  constructor(private readonly prisma: PrismaService) {}

  async listEvents(companyId: string, from?: string, to?: string) {
    const events = await this.prisma.calendarEvent.findMany({
      where: {
        companyId,
        ...(from || to
          ? {
              startsAt: {
                ...(from ? { gte: new Date(from) } : {}),
                ...(to ? { lte: new Date(to) } : {}),
              },
            }
          : {}),
      },
      include: {
        creator: { select: { id: true, fullName: true, avatarUrl: true } },
        attendees: {
          include: {
            user: { select: { id: true, fullName: true, avatarUrl: true } },
          },
        },
      },
      orderBy: { startsAt: 'asc' },
    });

    if (!events.length) return events;

    const rangeFrom = from
      ? new Date(from)
      : events.reduce(
          (min, e) => (e.startsAt < min ? e.startsAt : min),
          events[0].startsAt,
        );
    const rangeTo = to
      ? new Date(to)
      : events.reduce(
          (max, e) => (e.endsAt > max ? e.endsAt : max),
          events[0].endsAt,
        );

    const conflicts = await this.detectConflicts(
      companyId,
      rangeFrom.toISOString(),
      rangeTo.toISOString(),
    );

    return events.map((event) => ({
      ...event,
      conflicts: conflicts
        .filter((c) => c.eventId === event.id)
        .map((c) => ({ leaveId: c.leaveId, userId: c.userId, userName: c.userName })),
    }));
  }

  createEvent(
    companyId: string,
    creatorId: string,
    input: CreateCalendarEventInput,
  ) {
    const startsAt = new Date(input.startsAt);
    const endsAt = new Date(input.endsAt);
    if (endsAt <= startsAt) {
      throw new BadRequestException('endsAt must be after startsAt');
    }
    return this.prisma.calendarEvent.create({
      data: {
        companyId,
        creatorId,
        title: input.title,
        description: input.description,
        location: input.location,
        startsAt,
        endsAt,
        attendees: {
          create: input.attendeeIds.map((userId) => ({ userId })),
        },
      },
      include: {
        attendees: {
          include: {
            user: { select: { id: true, fullName: true, avatarUrl: true } },
          },
        },
      },
    });
  }

  async detectConflicts(companyId: string, from: string, to: string) {
    const starts = new Date(from);
    const ends = new Date(to);
    const [events, leaves] = await Promise.all([
      this.prisma.calendarEvent.findMany({
        where: {
          companyId,
          startsAt: { lte: ends },
          endsAt: { gte: starts },
        },
        include: {
          attendees: true,
        },
      }),
      this.prisma.leaveRequest.findMany({
        where: {
          companyId,
          status: 'APPROVED',
          startDate: { lte: ends },
          endDate: { gte: starts },
        },
        include: {
          user: { select: { id: true, fullName: true } },
        },
      }),
    ]);

    const conflicts: Array<{
      eventId: string;
      eventTitle: string;
      userId: string;
      userName: string;
      leaveId: string;
    }> = [];

    for (const event of events) {
      for (const attendee of event.attendees) {
        for (const leave of leaves) {
          if (leave.userId !== attendee.userId) continue;
          const leaveStart = leave.startDate;
          const leaveEnd = new Date(leave.endDate);
          leaveEnd.setUTCHours(23, 59, 59, 999);
          if (event.startsAt <= leaveEnd && event.endsAt >= leaveStart) {
            conflicts.push({
              eventId: event.id,
              eventTitle: event.title,
              userId: leave.user.id,
              userName: leave.user.fullName,
              leaveId: leave.id,
            });
          }
        }
      }
    }

    return conflicts;
  }
}
