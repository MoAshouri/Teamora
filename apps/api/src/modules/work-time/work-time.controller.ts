import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SubmitTimeEntrySchema } from '@teamora/shared';
import { z } from 'zod';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../../common/auth/roles.decorator';
import { RolesGuard } from '../../common/auth/roles.guard';
import { TenantGuard } from '../../common/tenant/tenant.guard';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { AuthUser } from '../../common/auth/auth-user';
import { WorkTimeService } from './work-time.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';

@Controller('work-time')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class WorkTimeController {
  constructor(
    private readonly workTime: WorkTimeService,
    private readonly realtime: RealtimeGateway,
  ) {}

  @Post('session/start')
  @Roles('EMPLOYEE')
  async start(@CurrentUser() user: AuthUser) {
    const session = await this.workTime.startSession(user.companyId!, user.id);
    this.realtime.emitPresence(user.companyId!, {
      type: 'session_started',
      userId: user.id,
      session,
    });
    return session;
  }

  @Post('session/end')
  @Roles('EMPLOYEE')
  async end(@CurrentUser() user: AuthUser) {
    const result = await this.workTime.endSession(user.companyId!, user.id);
    this.realtime.emitPresence(user.companyId!, {
      type: 'session_ended',
      userId: user.id,
    });
    return result;
  }

  @Get('session/me')
  @Roles('EMPLOYEE')
  mySession(@CurrentUser() user: AuthUser) {
    return this.workTime.getMySession(user.id);
  }

  @Get('sessions/active')
  @Roles('ADMIN')
  active(@CurrentUser() user: AuthUser) {
    return this.workTime.listActiveSessions(user.companyId!);
  }

  @Post('entries')
  @Roles('EMPLOYEE')
  submit(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    const input = SubmitTimeEntrySchema.parse(body);
    return this.workTime.submitEntry(user.companyId!, user.id, input);
  }

  @Get('entries')
  list(
    @CurrentUser() user: AuthUser,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.workTime.listEntries(user, from, to);
  }

  @Patch('entries/:id')
  @Roles('ADMIN')
  review(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    const parsed = z.object({ status: z.enum(['APPROVED', 'REJECTED']) }).safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException('status must be APPROVED or REJECTED');
    }
    return this.workTime.reviewEntry(user.companyId!, user.id, id, parsed.data.status);
  }

  @Get('weekly/company')
  @Roles('ADMIN')
  companyWeekly(@CurrentUser() user: AuthUser) {
    return this.workTime.weeklyHoursByPerson(user.companyId!);
  }

  @Get('weekly')
  weekly(@CurrentUser() user: AuthUser, @Query('userId') userId?: string) {
    const requested = userId?.trim() || undefined;
    if (user.role === 'EMPLOYEE') {
      if (requested && requested !== user.id) {
        throw new ForbiddenException('Cannot read another person\'s hours');
      }
      return this.workTime.weeklyHours(user.companyId!, user.id);
    }
    return this.workTime.weeklyHours(user.companyId!, requested);
  }
}
