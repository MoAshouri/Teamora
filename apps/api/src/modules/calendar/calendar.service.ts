import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { CreateCalendarEventInput, UpdateCalendarEventInput } from '@teamora/shared';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthUser } from '../../common/auth/auth-user';
import {
  companyMemberIds,
  employeeCanSeeEvent,
  inCompanyAttendees,
  isCompanyWideMeeting,
} from './calendar-visibility';
import { ymdUtc, zonedInclusiveDayRange } from '../../common/zoned-time';

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
              ...(from ? { endsAt: { gte: new Date(from) } } : {}),
              ...(to ? { startsAt: { lte: new Date(to) } } : {}),
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
    const inCompany = companyMemberIds({
      adminId: company?.adminId ?? null,
      memberships: company?.memberships ?? [],
    });
    const scoped = events.map((event) => {
      const attendees = inCompanyAttendees(event.attendees, inCompany);
      return {
        ...event,
        attendees,
        companyWide: isCompanyWideMeeting(attendees.length, event.attendees.length),
      };
    });
    const visible =
      user.role === 'EMPLOYEE'
        ? scoped.filter((event, index) =>
            employeeCanSeeEvent(event, user.id, events[index]?.attendees.length ?? 0),
          )
        : scoped;
    // #region agent log
    fetch('http://127.0.0.1:7869/ingest/c694b7eb-dcc2-4100-9c19-d4aca06d483e',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a506d6'},body:JSON.stringify({sessionId:'a506d6',runId:'post-fix',hypothesisId:'FA',location:'calendar.service.ts:listEvents',message:'calendar overlap query',data:{role:user.role,from:from??null,to:to??null,raw:events.length,visible:visible.length,openMeetings:visible.filter((row)=>row.companyWide).length,foreignOnlyOpen:scoped.filter((row)=>row.companyWide===false&&row.attendees.length===0).length},timestamp:Date.now()})}).catch(()=>{});
    // #endregion

    if (!visible.length) return visible;
    if (user.role !== 'ADMIN') {
      return visible.map((event) => ({
        ...event,
        conflicts: [] as Array<{ leaveId: string; userId: string; userName: string }>,
      }));
    }

    const rangeFrom = from
      ? new Date(from)
      : visible.reduce(
          (min, e) => (e.startsAt < min ? e.startsAt : min),
          visible[0].startsAt,
        );
    const rangeTo = to
      ? new Date(to)
      : visible.reduce(
          (max, e) => (e.endsAt > max ? e.endsAt : max),
          visible[0].endsAt,
        );

    const conflicts = await this.detectConflicts(
      companyId,
      rangeFrom.toISOString(),
      rangeTo.toISOString(),
    );
    // #region agent log
    fetch('http://127.0.0.1:7869/ingest/c694b7eb-dcc2-4100-9c19-d4aca06d483e',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a506d6'},body:JSON.stringify({sessionId:'a506d6',runId:'post-fix',hypothesisId:'AN',location:'calendar.service.ts:listEvents',message:'conflicts attached for admin only',data:{role:user.role,events:visible.length,conflicts:conflicts.length},timestamp:Date.now()})}).catch(()=>{});
    // #endregion

    return visible.map((event) => ({
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
      include: { attendees: { select: { userId: true } } },
    });
    if (!existing) throw new NotFoundException('Event not found');
    const startsAt = input.startsAt ? new Date(input.startsAt) : existing.startsAt;
    const endsAt = input.endsAt ? new Date(input.endsAt) : existing.endsAt;
    if (endsAt <= startsAt) {
      throw new BadRequestException('endsAt must be after startsAt');
    }
    let attendeeIds = input.attendeeIds;
    if (attendeeIds !== undefined) {
      await this.assertAttendees(companyId, attendeeIds);
      const company = await this.prisma.company.findUnique({
        where: { id: companyId },
        select: { adminId: true, memberships: { select: { userId: true } } },
      });
      const inCompany = companyMemberIds({
        adminId: company?.adminId ?? null,
        memberships: company?.memberships ?? [],
      });
      const keepForeign = existing.attendees
        .map((row) => row.userId)
        .filter((userId) => !inCompany.has(userId));
      const postedCount = attendeeIds.length;
      attendeeIds = [...new Set([...attendeeIds, ...keepForeign])];
      // #region agent log
      fetch('http://127.0.0.1:7869/ingest/c694b7eb-dcc2-4100-9c19-d4aca06d483e',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a506d6'},body:JSON.stringify({sessionId:'a506d6',runId:'post-fix',hypothesisId:'FA',location:'calendar.service.ts:updateEvent',message:'preserve leftover foreign attendees',data:{posted:postedCount,keepForeign:keepForeign.length,next:attendeeIds.length,companyWide:isCompanyWideMeeting(postedCount,attendeeIds.length)},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
    }
    return this.prisma.calendarEvent.update({
      where: { id },
      data: {
        ...(input.title != null ? { title: input.title } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.location !== undefined ? { location: input.location } : {}),
        startsAt,
        endsAt,
        ...(attendeeIds
          ? {
              attendees: {
                deleteMany: {},
                create: attendeeIds.map((userId) => ({ userId })),
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
    const [events, leaves, company, policy] = await Promise.all([
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
      this.prisma.company.findUnique({
        where: { id: companyId },
        select: { adminId: true, memberships: { select: { userId: true } } },
      }),
      this.prisma.workPolicy.findUnique({
        where: { companyId },
        select: { timezone: true },
      }),
    ]);

    const timeZone = policy?.timezone || 'Asia/Tehran';
    const inCompany = companyMemberIds({
      adminId: company?.adminId ?? null,
      memberships: company?.memberships ?? [],
    });
    const everyone = [...inCompany];

    const conflicts: Array<{
      eventId: string;
      eventTitle: string;
      userId: string;
      userName: string;
      leaveId: string;
    }> = [];

    let openEvents = 0;
    let zonedHits = 0;
    for (const event of events) {
      const local = inCompanyAttendees(event.attendees, inCompany);
      const people =
        local.length > 0
          ? local.map((row) => row.userId)
          : event.attendees.length === 0
            ? everyone
            : [];
      if (event.attendees.length === 0) openEvents += 1;
      for (const userId of people) {
        for (const leave of leaves) {
          if (leave.userId !== userId) continue;
          const range = zonedInclusiveDayRange(ymdUtc(leave.startDate), ymdUtc(leave.endDate), timeZone);
          if (event.startsAt < range.end && event.endsAt > range.start) {
            zonedHits += 1;
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
    // #region agent log
    fetch('http://127.0.0.1:7869/ingest/c694b7eb-dcc2-4100-9c19-d4aca06d483e',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a506d6'},body:JSON.stringify({sessionId:'a506d6',runId:'post-fix',hypothesisId:'LZ',location:'calendar.service.ts:detectConflicts',message:'leave overlap uses company timezone days',data:{timeZone,events:events.length,openEvents,conflicts:conflicts.length,zonedHits},timestamp:Date.now()})}).catch(()=>{});
    // #endregion

    return conflicts;
  }
}
