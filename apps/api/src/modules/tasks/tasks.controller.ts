import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ListTasksQuerySchema } from '@teamora/shared';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../../common/auth/roles.decorator';
import { RolesGuard } from '../../common/auth/roles.guard';
import { TenantGuard } from '../../common/tenant/tenant.guard';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { AuthUser } from '../../common/auth/auth-user';
import { TasksService } from './tasks.service';

@Controller('tasks')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Get()
  @Roles('ADMIN')
  list(
    @CurrentUser() user: AuthUser,
    @Query('starred') starred?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const query = ListTasksQuerySchema.parse({
      ...(starred != null && starred !== '' ? { starred } : {}),
      from,
      to,
    });
    return this.tasks.list(user.companyId!, query);
  }
}
