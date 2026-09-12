import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantGuard } from '../../common/tenant/tenant.guard';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { AuthUser } from '../../common/auth/auth-user';
import { HolidaysService } from './holidays.service';

@Controller('holidays')
@UseGuards(JwtAuthGuard, TenantGuard)
export class HolidaysController {
  constructor(private readonly holidays: HolidaysService) {}

  @Get()
  list(@CurrentUser() user: AuthUser, @Query('year') year?: string) {
    return this.holidays.listForCompany(user.companyId!, year ? Number(year) : undefined);
  }
}
