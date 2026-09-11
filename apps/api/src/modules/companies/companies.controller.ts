import { BadRequestException, Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { UpsertWorkPolicySchema } from '@teamora/shared';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../../common/auth/roles.decorator';
import { RolesGuard } from '../../common/auth/roles.guard';
import { TenantGuard } from '../../common/tenant/tenant.guard';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { AuthUser } from '../../common/auth/auth-user';
import { CompaniesService } from './companies.service';

@Controller('companies')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class CompaniesController {
  constructor(private readonly companies: CompaniesService) {}

  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return this.companies.getCompany(user.companyId!);
  }

  @Get('work-policy')
  @Roles('ADMIN', 'EMPLOYEE')
  getPolicy(@CurrentUser() user: AuthUser) {
    return this.companies.getWorkPolicy(user.companyId!);
  }

  @Put('work-policy')
  @Roles('ADMIN')
  upsertPolicy(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    const parsed = UpsertWorkPolicySchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException('Invalid work policy');
    }
    return this.companies.upsertWorkPolicy(user.companyId!, parsed.data);
  }
}
