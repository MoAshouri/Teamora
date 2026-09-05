import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantGuard } from '../../common/tenant/tenant.guard';
import { HolidaysService } from './holidays.service';
import type { CalendarType } from '@prisma/client';

@Controller('holidays')
@UseGuards(JwtAuthGuard, TenantGuard)
export class HolidaysController {
  constructor(private readonly holidays: HolidaysService) {}

  @Get()
  list(
    @Query('calendarType') calendarType?: CalendarType,
    @Query('countryCode') countryCode?: string,
    @Query('year') year?: string,
  ) {
    return this.holidays.list({
      calendarType,
      countryCode,
      year: year ? Number(year) : undefined,
    });
  }
}
