import { Injectable } from '@nestjs/common';
import type { CalendarType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class HolidaysService {
  constructor(private readonly prisma: PrismaService) {}

  list(opts: {
    calendarType?: CalendarType;
    countryCode?: string;
    year?: number;
  }) {
    return this.prisma.holiday.findMany({
      where: {
        ...(opts.calendarType ? { calendarType: opts.calendarType } : {}),
        ...(opts.countryCode ? { countryCode: opts.countryCode } : {}),
        ...(opts.year
          ? {
              date: {
                gte: new Date(`${opts.year}-01-01`),
                lt: new Date(`${opts.year + 1}-01-01`),
              },
            }
          : {}),
      },
      orderBy: { date: 'asc' },
    });
  }
}
