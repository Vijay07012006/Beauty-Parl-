import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Get, Put, Request, Res, UnauthorizedException, BadRequestException, Delete, Param } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';
import { UserRole } from './user.entity';
import { GoogleAuthGuard } from './google-auth.guard';
import { FacebookAuthGuard } from './facebook-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

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
  async login(@Body() loginDto: { email?: string; password?: string }, @Request() req: any) {
    const email = typeof loginDto?.email === 'string' ? loginDto.email.trim().toLowerCase() : '';
    const password = typeof loginDto?.password === 'string' ? loginDto.password : '';
    if (!email || !password) {
      throw new BadRequestException('Email and password are required');
    }
    const user = await this.authService.validateUser(email, password);
    if (!user) {
      throw new BadRequestException('Invalid credentials');
    }
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];
    return this.authService.login(user, { ipAddress, userAgent });
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
    const sessionId = parseInt(id, 10);
    if (isNaN(sessionId)) {
      throw new BadRequestException('Invalid session id');
    }
    await this.authService.revokeSession(req.user.id, sessionId);
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
  async exchangeOauthCode(@Body() body: { code: string }) {
    return this.authService.exchangeOauthCode(body.code);
  }

  @Get('2fa/generate')
  @UseGuards(JwtAuthGuard)
  async generateTwoFactor(@Request() req: any) {
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
  ) {
    if (!body.email || !body.token) {
      throw new BadRequestException('email and token are required');
    }
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];
    return this.authService.verifyTwoFactorLogin(body.email, body.token, { ipAddress, userAgent });
  }
}
