import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';
import type { Profile } from 'passport-google-oauth20';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { AuthUser } from '../../common/auth/auth-user';

const COOKIE = 'access_token';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  private setCookie(res: Response, token: string) {
    res.cookie(COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  @Post('register-admin')
  async registerAdmin(@Body() body: unknown, @Res({ passthrough: true }) res: Response) {
    const result = await this.auth.registerAdmin(body);
    this.setCookie(res, result.token);
    return result;
  }

  @Post('login')
  async login(@Body() body: unknown, @Res({ passthrough: true }) res: Response) {
    const result = await this.auth.loginPassword(body);
    this.setCookie(res, result.token);
    return result;
  }

  @Post('otp/request')
  requestOtp(@Body() body: unknown) {
    return this.auth.requestOtp(body);
  }

  @Post('otp/verify')
  async verifyOtp(@Body() body: unknown, @Res({ passthrough: true }) res: Response) {
    const result = await this.auth.verifyOtp(body);
    this.setCookie(res, result.token);
    return result;
  }

  @Post('join')
  async join(@Body() body: unknown, @Res({ passthrough: true }) res: Response) {
    const result = await this.auth.joinCompany(body);
    this.setCookie(res, result.token);
    return result;
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth() {
    return;
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const profile = req.user as Profile;
    const result = await this.auth.loginOrLinkGoogle(profile);
    this.setCookie(res, result.token);
    const web = process.env.API_CORS_ORIGIN ?? 'http://localhost:3000';
    const rolePath = result.user.role === 'ADMIN' ? 'admin' : 'employee';
    return res.redirect(`${web}/app/${rolePath}/dashboard`);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: AuthUser) {
    return this.auth.me(user.id);
  }

  @Post('password')
  @UseGuards(JwtAuthGuard)
  setPassword(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    return this.auth.setPassword(user.id, body);
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(COOKIE);
    return { ok: true };
  }
}
