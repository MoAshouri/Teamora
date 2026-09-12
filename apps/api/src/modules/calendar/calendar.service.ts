import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { CreateCalendarEventInput, UpdateCalendarEventInput } from '@teamora/shared';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthUser } from '../../common/auth/auth-user';

@Injectable()
export class CalendarService {
  constructor(private readonly prisma: PrismaService) {}

  async listEvents(user: AuthUser, from?: string, to?: string) {
    const companyId = user.companyId!;
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
        ...(user.role === 'EMPLOYEE'
          ? {
              OR: [
                { creatorId: user.id },
                { attendees: { some: { userId: user.id } } },
                { attendees: { none: {} } },
              ],
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

    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { adminId: true, memberships: { select: { userId: true } } },
    });
    const inCompany = new Set<string>([
      ...(company?.adminId ? [company.adminId] : []),
      ...(company?.memberships.map((row) => row.userId) ?? []),
    ]);
    const scoped = events.map((event) => ({
      ...event,
      attendees: event.attendees.filter((row) => inCompany.has(row.userId)),
    }));
    // #region agent log
    fetch('http://127.0.0.1:7869/ingest/c694b7eb-dcc2-4100-9c19-d4aca06d483e',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a506d6'},body:JSON.stringify({sessionId:'a506d6',runId:'post-fix',hypothesisId:'AB',location:'calendar.service.ts:listEvents',message:'calendar visibility',data:{role:user.role,raw:events.length,visible:scoped.length,openMeetings:scoped.filter((row)=>row.attendees.length===0).length,droppedAttendees:events.reduce((n,e)=>n+e.attendees.length,0)-scoped.reduce((n,e)=>n+e.attendees.length,0)},timestamp:Date.now()})}).catch(()=>{});
    // #endregion

    if (!scoped.length) return scoped;

    const rangeFrom = from
      ? new Date(from)
      : scoped.reduce(
          (min, e) => (e.startsAt < min ? e.startsAt : min),
          scoped[0].startsAt,
        );
    const rangeTo = to
      ? new Date(to)
      : scoped.reduce(
          (max, e) => (e.endsAt > max ? e.endsAt : max),
          scoped[0].endsAt,
        );

    if (user.role !== 'ADMIN') {
      return scoped.map((event) => ({ ...event, conflicts: [] as Array<{ leaveId: string; userId: string; userName: string }> }));
    }

    const conflicts = await this.detectConflicts(
      companyId,
      rangeFrom.toISOString(),
      rangeTo.toISOString(),
    );
    // #region agent log
    fetch('http://127.0.0.1:7869/ingest/c694b7eb-dcc2-4100-9c19-d4aca06d483e',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a506d6'},body:JSON.stringify({sessionId:'a506d6',runId:'post-fix',hypothesisId:'AN',location:'calendar.service.ts:listEvents',message:'conflicts attached for admin only',data:{role:user.role,events:scoped.length,conflicts:conflicts.length},timestamp:Date.now()})}).catch(()=>{});
    // #endregion

    return scoped.map((event) => ({
      ...event,
      conflicts: conflicts
        .filter((c) => c.eventId === event.id)
        .map((c) => ({ leaveId: c.leaveId, userId: c.userId, userName: c.userName })),
    }));
  }

  async createEvent(
    companyId: string,
    creatorId: string,
    input: CreateCalendarEventInput,
  ) {
    const startsAt = new Date(input.startsAt);
    const endsAt = new Date(input.endsAt);
    if (endsAt <= startsAt) {
      throw new BadRequestException('endsAt must be after startsAt');
    }
    // #region agent log
    fetch('http://127.0.0.1:7869/ingest/c694b7eb-dcc2-4100-9c19-d4aca06d483e',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a506d6'},body:JSON.stringify({sessionId:'a506d6',runId:'pre-fix',hypothesisId:'L',location:'calendar.service.ts:createEvent',message:'create event attendees unchecked',data:{companyId,attendeeCount:input.attendeeIds.length,attendeeIds:input.attendeeIds},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    await this.assertAttendees(companyId, input.attendeeIds);
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

  private eventInclude() {
    return {
      attendees: {
        include: {
          user: { select: { id: true, fullName: true, avatarUrl: true } },
        },
      },
    } as const;
  }

  async updateEvent(companyId: string, id: string, input: UpdateCalendarEventInput) {
    const existing = await this.prisma.calendarEvent.findFirst({
      where: { id, companyId },
    });
    if (!existing) throw new NotFoundException('Event not found');
    const startsAt = input.startsAt ? new Date(input.startsAt) : existing.startsAt;
    const endsAt = input.endsAt ? new Date(input.endsAt) : existing.endsAt;
    if (endsAt <= startsAt) {
      throw new BadRequestException('endsAt must be after startsAt');
    }
    if (input.attendeeIds) {
      await this.assertAttendees(companyId, input.attendeeIds);
    }
    return this.prisma.calendarEvent.update({
      where: { id },
      data: {
        ...(input.title != null ? { title: input.title } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.location !== undefined ? { location: input.location } : {}),
        startsAt,
        endsAt,
        ...(input.attendeeIds
          ? {
              attendees: {
                deleteMany: {},
                create: input.attendeeIds.map((userId) => ({ userId })),
              },
            }
          : {}),
      },
      include: this.eventInclude(),
    });
  }

  async deleteEvent(companyId: string, id: string) {
    const existing = await this.prisma.calendarEvent.findFirst({
      where: { id, companyId },
    });
    if (!existing) throw new NotFoundException('Event not found');
    await this.prisma.calendarEvent.delete({ where: { id } });
  }

  private async assertAttendees(companyId: string, userIds: string[]) {
    for (const userId of userIds) {
      const member = await this.prisma.companyMembership.findFirst({
        where: { companyId, userId },
      });
      const company = await this.prisma.company.findFirst({
        where: { id: companyId, adminId: userId },
      });
      if (!member && !company) {
        throw new ForbiddenException('Attendee not in company');
      }
    }
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
