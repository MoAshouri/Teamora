import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CreateTaskSchema, ListTasksQuerySchema, UpdateTaskSchema } from '@teamora/shared';
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
  list(
    @CurrentUser() user: AuthUser,
    @Query('starred') starred?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const parsed = ListTasksQuerySchema.safeParse({
      ...(starred != null && starred !== '' ? { starred } : {}),
      from,
      to,
    });
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten());
    }
    return this.tasks.list(user, parsed.data);
  }

  @Post()
  @Roles('ADMIN')
  create(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    const parsed = CreateTaskSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten());
    }
    return this.tasks.create(user.companyId!, user.id, parsed.data);
  }

  @Patch(':id')
  @Roles('ADMIN')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    const parsed = UpdateTaskSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten());
    }
    return this.tasks.update(user.companyId!, id, parsed.data);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @HttpCode(204)
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.tasks.delete(user.companyId!, id);
  }
}
