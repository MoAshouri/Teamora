import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CreateReminderSchema, ExtendReminderSchema } from '@teamora/shared';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { TenantGuard } from '../../common/tenant/tenant.guard';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { AuthUser } from '../../common/auth/auth-user';
import { RemindersService } from './reminders.service';

@Controller('reminders')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class RemindersController {
  constructor(private readonly reminders: RemindersService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    const parsed = CreateReminderSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten());
    }
    return this.reminders.create(user, parsed.data);
  }

  @Get('due')
  due(@CurrentUser() user: AuthUser) {
    return this.reminders.due(user);
  }

  @Post(':id/ack')
  ack(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.reminders.ack(user, id);
  }

  @Post(':id/disable')
  disable(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.reminders.disable(user, id);
  }

  @Post(':id/extend')
  extend(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    const parsed = ExtendReminderSchema.safeParse(body ?? {});
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten());
    }
    return this.reminders.extend(user, id, parsed.data);
  }
}
