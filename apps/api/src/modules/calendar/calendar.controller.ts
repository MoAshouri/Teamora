import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CreateCalendarEventSchema } from '@teamora/shared';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { TenantGuard } from '../../common/tenant/tenant.guard';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { AuthUser } from '../../common/auth/auth-user';
import { CalendarService } from './calendar.service';

@Controller('calendar')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class CalendarController {
  constructor(private readonly calendar: CalendarService) {}

  @Get('events')
  list(
    @CurrentUser() user: AuthUser,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.calendar.listEvents(user.companyId!, from, to);
  }

  @Post('events')
  create(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    const input = CreateCalendarEventSchema.parse(body);
    return this.calendar.createEvent(user.companyId!, user.id, input);
  }

  @Get('conflicts')
  conflicts(
    @CurrentUser() user: AuthUser,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.calendar.detectConflicts(user.companyId!, from, to);
  }
}
