import { Body, Controller, Get, Post, UseGuards, BadRequestException } from '@nestjs/common';
import { CreateInviteSchema } from '@teamora/shared';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../../common/auth/roles.decorator';
import { RolesGuard } from '../../common/auth/roles.guard';
import { TenantGuard } from '../../common/tenant/tenant.guard';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { AuthUser } from '../../common/auth/auth-user';
import { InvitesService } from './invites.service';

@Controller('invites')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class InvitesController {
  constructor(private readonly invites: InvitesService) {}

  @Get()
  @Roles('ADMIN')
  list(@CurrentUser() user: AuthUser) {
    return this.invites.list(user.companyId!);
  }

  @Post()
  @Roles('ADMIN')
  create(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    const parsed = CreateInviteSchema.safeParse(body ?? {});
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten());
    }
    return this.invites.create(user.companyId!, user.id, parsed.data);
  }
}
