import { Body, Controller, Get, Param, Post, UseGuards, BadRequestException } from '@nestjs/common';
import { CreateLetterSchema } from '@teamora/shared';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../../common/auth/roles.decorator';
import { RolesGuard } from '../../common/auth/roles.guard';
import { TenantGuard } from '../../common/tenant/tenant.guard';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { AuthUser } from '../../common/auth/auth-user';
import { LettersService } from './letters.service';

@Controller('letters')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class LettersController {
  constructor(private readonly letters: LettersService) {}

  @Post()
  @Roles('ADMIN')
  create(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    const parsed = CreateLetterSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException('Subject and body are required');
    }
    return this.letters.create(user.companyId!, user.id, parsed.data);
  }

  @Get()
  @Roles('ADMIN')
  list(@CurrentUser() user: AuthUser) {
    return this.letters.listCompany(user.companyId!);
  }

  @Get('inbox')
  @Roles('EMPLOYEE')
  inbox(@CurrentUser() user: AuthUser) {
    return this.letters.inbox(user.companyId!, user.id);
  }

  @Post(':id/read')
  @Roles('EMPLOYEE')
  read(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.letters.markRead(user.companyId!, user.id, id);
  }
}
