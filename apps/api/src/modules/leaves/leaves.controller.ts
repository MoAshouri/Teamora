import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  CreateBonusLeaveSchema,
  CreateLeaveRequestSchema,
  ReviewLeaveSchema,
} from '@teamora/shared';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../../common/auth/roles.decorator';
import { RolesGuard } from '../../common/auth/roles.guard';
import { TenantGuard } from '../../common/tenant/tenant.guard';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { AuthUser } from '../../common/auth/auth-user';
import { LeavesService } from './leaves.service';

@Controller('leaves')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class LeavesController {
  constructor(private readonly leaves: LeavesService) {}

  @Post()
  @Roles('EMPLOYEE')
  create(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    const parsed = CreateLeaveRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten());
    }
    return this.leaves.create(user.companyId!, user.id, parsed.data);
  }

  @Get()
  list(
    @CurrentUser() user: AuthUser,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.leaves.list(user, from, to);
  }

  @Get('pending')
  @Roles('ADMIN')
  pending(@CurrentUser() user: AuthUser) {
    return this.leaves.pending(user.companyId!);
  }

  @Post('grants')
  @Roles('ADMIN')
  grant(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    const parsed = CreateBonusLeaveSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException('Invalid bonus grant');
    }
    return this.leaves.grant(user.companyId!, user.id, parsed.data);
  }

  @Get('balance/me')
  @Roles('EMPLOYEE')
  myBalance(@CurrentUser() user: AuthUser) {
    return this.leaves.balance(user.companyId!, user.id);
  }

  @Get('balance/:userId')
  @Roles('ADMIN')
  balanceFor(
    @CurrentUser() user: AuthUser,
    @Param('userId') userId: string,
  ) {
    return this.leaves.balance(user.companyId!, userId);
  }

  @Patch(':id')
  @Roles('ADMIN')
  review(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    const parsed = ReviewLeaveSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten());
    }
    return this.leaves.review(user.companyId!, user.id, id, parsed.data);
  }
}
