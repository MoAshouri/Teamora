import { Injectable } from '@nestjs/common';
import type { CalendarType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

function countryCodesForTimezone(timeZone: string) {
  if (timeZone === 'Asia/Tehran') return ['IR', 'INT'];
  if (timeZone === 'Asia/Yerevan') return ['AM', 'INT'];
  return ['INT'];
}

@Injectable()
export class HolidaysService {
  constructor(private readonly prisma: PrismaService) {}

  list(opts: {
    calendarType?: CalendarType;
    countryCode?: string;
    countryCodes?: string[];
    year?: number;
  }) {
    return this.prisma.holiday.findMany({
      where: {
        ...(opts.calendarType ? { calendarType: opts.calendarType } : {}),
        ...(opts.countryCode ? { countryCode: opts.countryCode } : {}),
        ...(opts.countryCodes?.length ? { countryCode: { in: opts.countryCodes } } : {}),
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

  async listForCompany(companyId: string, year?: number) {
    const policy = await this.prisma.workPolicy.findUnique({ where: { companyId } });
    const countryCodes = countryCodesForTimezone(policy?.timezone ?? 'Asia/Tehran');
    // #region agent log
    fetch('http://127.0.0.1:7869/ingest/c694b7eb-dcc2-4100-9c19-d4aca06d483e',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a506d6'},body:JSON.stringify({sessionId:'a506d6',runId:'post-fix',hypothesisId:'AO',location:'holidays.service.ts:listForCompany',message:'holiday countries from timezone',data:{timezone:policy?.timezone??'Asia/Tehran',countryCodes,year:year??null},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    return this.list({ countryCodes, year });
  }
}
