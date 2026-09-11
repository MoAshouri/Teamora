import { BadRequestException, Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { UpdateProfileSchema } from '@teamora/shared';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../../common/auth/roles.decorator';
import { RolesGuard } from '../../common/auth/roles.guard';
import { TenantGuard } from '../../common/tenant/tenant.guard';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { AuthUser } from '../../common/auth/auth-user';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return this.users.getProfile(user.id);
  }

  @Patch('me')
  updateMe(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    const parsed = UpdateProfileSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten());
    }
    return this.users.updateProfile(user.id, parsed.data);
  }

  @Get()
  @Roles('ADMIN')
  list(@CurrentUser() user: AuthUser) {
    return this.users.listCompanyEmployees(user.companyId!);
  }
}
