import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CreateLeaveRequestSchema, ReviewLeaveSchema } from '@teamora/shared';
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
    const input = CreateLeaveRequestSchema.parse(body);
    return this.leaves.create(user.companyId!, user.id, input);
  }

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.leaves.list(user);
  }

  @Get('pending')
  @Roles('ADMIN')
  pending(@CurrentUser() user: AuthUser) {
    return this.leaves.pending(user.companyId!);
  }

  @Patch(':id')
  @Roles('ADMIN')
  review(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    const input = ReviewLeaveSchema.parse(body);
    return this.leaves.review(user.companyId!, user.id, id, input);
  }

  @Get('balance/me')
  @Roles('EMPLOYEE')
  balance(@CurrentUser() user: AuthUser) {
    return this.leaves.balance(user.companyId!, user.id);
  }
}
