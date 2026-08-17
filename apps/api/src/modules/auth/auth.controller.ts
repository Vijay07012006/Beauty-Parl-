import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Get, Put, Request, Res, UnauthorizedException, BadRequestException, Delete, Param } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';
import { UserRole } from './user.entity';
import { GoogleAuthGuard } from './google-auth.guard';
import { FacebookAuthGuard } from './facebook-auth.guard';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

const AUTH_COOKIE = 'bp_token';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private auditLogsService: AuditLogsService,
  ) {}

  // HttpOnly cookie — JS cannot read it, so an XSS cannot exfiltrate the session.
  private setAuthCookie(res: any, token: string) {
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie(AUTH_COOKIE, token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // matches config jwt.expiresIn
    });
  }

  private clearAuthCookie(res: any) {
    res.clearCookie(AUTH_COOKIE, { path: '/' });
  }

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: any) {
    try {
      return await this.authService.register(registerDto);
    } catch (error: any) {
      throw new BadRequestException(error.message || 'Registration failed');
    }
  }

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: { email?: string; password?: string }, @Request() req: any, @Res({ passthrough: true }) res: any) {
    const email = typeof loginDto?.email === 'string' ? loginDto.email.trim().toLowerCase() : '';
    const password = typeof loginDto?.password === 'string' ? loginDto.password : '';
    if (!email || !password) {
      throw new BadRequestException('Email and password are required');
    }
    const user = await this.authService.validateUser(email, password);
    if (!user) {
      await this.auditLogsService.recordFailedLogin(email, req.ip, req.headers['user-agent']);
      throw new BadRequestException('Invalid credentials');
    }
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];
    const result = await this.authService.login(user, { ipAddress, userAgent });
    if (result.access_token) {
      this.setAuthCookie(res, result.access_token);
    }
    return result;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Request() req: any, @Res({ passthrough: true }) res: any) {
    // Revoke the server-side session (if a valid token was presented) and clear the cookie.
    try {
      const cookieHeader = req.headers?.cookie;
      let cookieToken = '';
      if (cookieHeader && typeof cookieHeader === 'string') {
        for (const part of cookieHeader.split(';')) {
          const pair = part.trim();
          if (pair.startsWith(`${AUTH_COOKIE}=`)) {
            cookieToken = pair.substring(AUTH_COOKIE.length + 1);
            break;
          }
        }
      }
      const rawToken = cookieToken || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.substring(7) : '');
      if (rawToken) {
        await this.authService.revokeToken(rawToken);
      }
    } catch (error: any) {
      console.error('Logout session revoke failed:', error.message);
    }
    this.clearAuthCookie(res);
    return { success: true, message: 'Logged out' };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req: any) {
    return req.user;
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(@Request() req: any, @Body() body: { name?: string; phone?: string; birthday?: string }) {
    try {
      const user = await this.authService.updateProfile(
        req.user.id,
        body.name,
        body.phone,
        body.birthday ? new Date(body.birthday) : undefined
      );
      return { success: true, user };
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('admin-check')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async adminCheck(@Request() req: any) {
    return { isAdmin: true, user: req.user };
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  async changePassword(@Request() req: any, @Body() body: { currentPassword: string; newPassword: string }) {
    try {
      return await this.authService.changePassword(req.user.id, body.currentPassword, body.newPassword, req.user?.sessionId);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('forgot-password')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() body: { email: string }) {
    if (!body.email) {
      throw new BadRequestException('Email is required');
    }
    return this.authService.forgotPassword(body.email);
  }

  @Post('reset-password')
  @Throttle({ default: { limit: 10, ttl: 600000 } })
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() body: { token: string; newPassword: string }) {
    if (!body.token || !body.newPassword) {
      throw new BadRequestException('Token and newPassword are required');
    }
    return this.authService.resetPassword(body.token, body.newPassword);
  }

  @Get('preferences')
  @UseGuards(JwtAuthGuard)
  async getPreferences(@Request() req: any) {
    return this.authService.getPreferences(req.user.id);
  }

  @Put('preferences')
  @UseGuards(JwtAuthGuard)
  async updatePreferences(@Request() req: any, @Body() preferences: any) {
    const updated = await this.authService.updatePreferences(req.user.id, preferences);
    return { success: true, preferences: updated };
  }

  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  async getSessions(@Request() req: any) {
    return this.authService.getUserSessions(req.user.id);
  }

  @Delete('sessions/:id')
  @UseGuards(JwtAuthGuard)
  async revokeSession(@Request() req: any, @Param('id') id: string) {
    if (!id) {
      throw new BadRequestException('Invalid session id');
    }
    await this.authService.revokeSession(req.user.id, id);
    return { success: true, message: 'Session revoked' };
  }

  @Delete('sessions/all')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async revokeAllSessions(@Request() req: any) {
    await this.authService.revokeAllSessions(req.user.id);
    return { success: true, message: 'All sessions revoked' };
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth() {
    // Redirects to Google
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthRedirect(@Request() req: any, @Res() res: any) {
    const { access_token, user } = req.user;
    // Pass a short-lived one-time code, never the JWT, in the URL (H3)
    const code = await this.authService.issueOauthCode(access_token, user);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/en/auth/callback?code=${code}`);
  }

  @Get('facebook')
  @UseGuards(FacebookAuthGuard)
  async facebookAuth() {
    // Redirects to Facebook
  }

  @Get('facebook/callback')
  @UseGuards(FacebookAuthGuard)
  async facebookAuthRedirect(@Request() req: any, @Res() res: any) {
    const { access_token, user } = req.user;
    // Pass a short-lived one-time code, never the JWT, in the URL (H3)
    const code = await this.authService.issueOauthCode(access_token, user);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/en/auth/callback?code=${code}`);
  }

  @Post('oauth/exchange')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  async exchangeOauthCode(@Body() body: { code: string }, @Res({ passthrough: true }) res: any) {
    const result = await this.authService.exchangeOauthCode(body.code);
    this.setAuthCookie(res, result.access_token);
    return result;
  }

  @Get('2fa/generate')
  @UseGuards(JwtAuthGuard)
  async generateTwoFactor(@Request() req: any) {
    return this.authService.generateTwoFactorSecret(req.user.id);
  }

  @Post('2fa/enable')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async enableTwoFactorPost(@Request() req: any) {
    return this.authService.generateTwoFactorSecret(req.user.id);
  }

  @Post('2fa/verify-and-enable')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async verifyAndEnableTwoFactor(
    @Request() req: any,
    @Body() body: { token: string },
  ) {
    if (!body.token) {
      throw new BadRequestException('token is required');
    }
    return this.authService.verifyAndEnableTwoFactor(req.user.id, body.token);
  }

  @Post('2fa/verify')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async verifyTwoFactorPost(
    @Request() req: any,
    @Body() body: { token: string },
  ) {
    if (!body.token) {
      throw new BadRequestException('token is required');
    }
    return this.authService.verifyAndEnableTwoFactor(req.user.id, body.token);
  }

  @Post('2fa/disable')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async disableTwoFactor(
    @Request() req: any,
    @Body() body: { password: string },
  ) {
    if (!body.password) {
      throw new BadRequestException('password is required');
    }
    return this.authService.disableTwoFactor(req.user.id, body.password);
  }

  @Post('2fa/verify-login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async verifyTwoFactorLogin(
    @Body() body: { email: string; token: string },
    @Request() req: any,
    @Res({ passthrough: true }) res: any,
  ) {
    if (!body.email || !body.token) {
      throw new BadRequestException('email and token are required');
    }
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];
    const result = await this.authService.verifyTwoFactorLogin(body.email, body.token, { ipAddress, userAgent });
    if (result.access_token) {
      this.setAuthCookie(res, result.access_token);
    }
    return result;
  }
}
