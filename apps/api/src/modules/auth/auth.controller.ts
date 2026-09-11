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

  private cookieOpts() {
    return {
      httpOnly: true as const,
      sameSite: 'lax' as const,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    };
  }

  private setCookie(res: Response, token: string) {
    res.cookie(COOKIE, token, {
      ...this.cookieOpts(),
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

  @Post('email/verify/request')
  @UseGuards(JwtAuthGuard)
  requestEmailVerify(@CurrentUser() user: AuthUser) {
    return this.auth.requestEmailVerify(user.id);
  }

  @Post('email/verify/confirm')
  @UseGuards(JwtAuthGuard)
  confirmEmailVerify(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    return this.auth.confirmEmailVerify(user.id, body);
  }

  @Post('email/change/request')
  @UseGuards(JwtAuthGuard)
  requestEmailChange(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    return this.auth.requestEmailChange(user.id, body);
  }

  @Post('email/change/confirm')
  @UseGuards(JwtAuthGuard)
  confirmEmailChange(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    return this.auth.confirmEmailChange(user.id, body);
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

  @Post('password/change')
  @UseGuards(JwtAuthGuard)
  changePassword(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    return this.auth.changePassword(user.id, body);
  }

  @Post('logout')
  logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const hadCookie = Boolean(req.cookies?.[COOKIE]);
    res.clearCookie(COOKIE, this.cookieOpts());
    const setCookie = res.getHeader('Set-Cookie');
    // #region agent log
    fetch('http://127.0.0.1:7869/ingest/c694b7eb-dcc2-4100-9c19-d4aca06d483e',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a506d6'},body:JSON.stringify({sessionId:'a506d6',runId:'pre-fix',hypothesisId:'D',location:'auth.controller.ts:logout',message:'logout clearCookie',data:{hadCookie,setCookie:String(setCookie??''),secure:process.env.NODE_ENV==='production'},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    return { ok: true };
  }
}
