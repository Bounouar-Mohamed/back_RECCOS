import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus, Query, Get, Req, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { Public } from '../../common/decorators/public.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UaePassAuthGuard } from '../../common/guards/uae-pass.guard';
import { GoogleAuthGuard } from '../../common/guards/google.guard';
import { FacebookAuthGuard } from '../../common/guards/facebook.guard';
import { AppleAuthGuard } from '../../common/guards/apple.guard';
import type { Request, Response } from 'express';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Enable2FADto, TwoFactorMethod } from './dto/enable-2fa.dto';
import { Verify2FADto } from './dto/verify-2fa.dto';
import { LoginWith2FADto } from './dto/login-with-2fa.dto';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User successfully registered' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 tentatives par minute
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user (supports 2FA - TOTP or Email only)' })
  @ApiResponse({ status: 200, description: 'User successfully logged in' })
  @ApiResponse({ status: 401, description: 'Invalid credentials or 2FA code required' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async login(@Body() loginDto: LoginDto | LoginWith2FADto, @Req() req: Request) {
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
    return this.authService.login(loginDto as any, ipAddress);
  }

  @Public()
  @Get('verify-email')
  @ApiOperation({ summary: 'Verify email using token' })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @Public()
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 tentatives par minute
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend email verification link' })
  @ApiResponse({ status: 200, description: 'Verification email resent if possible' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async resendVerification(@Body() dto: ResendVerificationDto) {
    return this.authService.resendVerification(dto.email);
  }

  @Public()
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 tentatives par minute
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({ status: 200, description: 'Password reset email sent if account exists' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto, @Req() req: Request) {
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
    return this.authService.forgotPassword(forgotPasswordDto, ipAddress);
  }

  @Public()
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 tentatives par minute
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password using token' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto, @Req() req: Request) {
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
    return this.authService.resetPassword(resetPasswordDto, ipAddress);
  }

  @Public()
  @Get('uae-pass')
  @UseGuards(UaePassAuthGuard)
  @ApiOperation({ summary: 'Initiate UAE Pass authentication' })
  @ApiResponse({ status: 302, description: 'Redirects to UAE Pass login' })
  async uaePassAuth() {
    // Le guard Passport redirige automatiquement vers UAE Pass
    // Cette méthode ne sera jamais appelée directement
  }

  @Public()
  @Get('uae-pass/callback')
  @UseGuards(UaePassAuthGuard)
  @ApiOperation({ summary: 'UAE Pass callback' })
  @ApiResponse({ status: 200, description: 'UAE Pass authentication successful' })
  @ApiResponse({ status: 401, description: 'UAE Pass authentication failed' })
  async uaePassCallback(@Req() req: Request, @Res() res: Response) {
    const { user, accessToken } = req.user as any;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/auth/callback?token=${accessToken}&user=${JSON.stringify(user)}`);
  }

  @Public()
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Initiate Google authentication' })
  @ApiResponse({ status: 302, description: 'Redirects to Google login' })
  async googleAuth() {
    // Le guard redirige automatiquement
  }

  @Public()
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Google callback' })
  @ApiResponse({ status: 200, description: 'Google authentication successful' })
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const { user, accessToken } = req.user as any;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/auth/callback?token=${accessToken}&user=${JSON.stringify(user)}`);
  }

  @Public()
  @Get('facebook')
  @UseGuards(FacebookAuthGuard)
  @ApiOperation({ summary: 'Initiate Facebook authentication' })
  @ApiResponse({ status: 302, description: 'Redirects to Facebook login' })
  async facebookAuth() {
    // Le guard redirige automatiquement
  }

  @Public()
  @Get('facebook/callback')
  @UseGuards(FacebookAuthGuard)
  @ApiOperation({ summary: 'Facebook callback' })
  @ApiResponse({ status: 200, description: 'Facebook authentication successful' })
  async facebookCallback(@Req() req: Request, @Res() res: Response) {
    const { user, accessToken } = req.user as any;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/auth/callback?token=${accessToken}&user=${JSON.stringify(user)}`);
  }

  @Public()
  @Get('apple')
  @UseGuards(AppleAuthGuard)
  @ApiOperation({ summary: 'Initiate Apple authentication' })
  @ApiResponse({ status: 302, description: 'Redirects to Apple login' })
  async appleAuth() {
    // Le guard redirige automatiquement
  }

  @Public()
  @Get('apple/callback')
  @UseGuards(AppleAuthGuard)
  @ApiOperation({ summary: 'Apple callback' })
  @ApiResponse({ status: 200, description: 'Apple authentication successful' })
  async appleCallback(@Req() req: Request, @Res() res: Response) {
    const { user, accessToken } = req.user as any;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/auth/callback?token=${accessToken}&user=${JSON.stringify(user)}`);
  }

  @UseGuards(JwtAuthGuard)
  @Post('enable-2fa')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Enable 2FA for user (TOTP or Email only - SMS disabled for security)' })
  @ApiResponse({ status: 200, description: '2FA enabled successfully' })
  @ApiResponse({ status: 400, description: '2FA already enabled or invalid method' })
  async enable2FA(@Body() enable2FADto: Enable2FADto, @CurrentUser() user: any) {
    return this.authService.enable2FA(
      user.id,
      enable2FADto.method,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('verify-2fa')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify 2FA code and complete activation' })
  @ApiResponse({ status: 200, description: '2FA verified and enabled' })
  @ApiResponse({ status: 400, description: 'Invalid 2FA code' })
  async verify2FA(@Body() verify2FADto: Verify2FADto, @CurrentUser() user: any) {
    return this.authService.verifyAndEnable2FA(user.id, verify2FADto.code);
  }

  @UseGuards(JwtAuthGuard)
  @Post('disable-2fa')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Disable 2FA for user' })
  @ApiResponse({ status: 200, description: '2FA disabled successfully' })
  @ApiResponse({ status: 400, description: '2FA is not enabled' })
  async disable2FA(@CurrentUser() user: any) {
    return this.authService.disable2FA(user.id);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 tentatives par minute
  @Post('send-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send OTP code by email for unified login/signup' })
  @ApiResponse({ status: 200, description: 'OTP code sent successfully' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async sendOTP(@Body() sendOtpDto: SendOtpDto, @Req() req: Request) {
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
    return this.authService.sendOTP(sendOtpDto.email, ipAddress);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 tentatives par minute
  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP code and login/signup' })
  @ApiResponse({ status: 200, description: 'OTP verified successfully, user logged in' })
  @ApiResponse({ status: 401, description: 'Invalid or expired OTP code' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async verifyOTP(@Body() verifyOtpDto: VerifyOtpDto, @Req() req: Request) {
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
    return this.authService.verifyOTP(verifyOtpDto.email, verifyOtpDto.code, ipAddress);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiResponse({ status: 200, description: 'Session refreshed successfully' })
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshSession(dto.refreshToken);
  }

  @Public()
  @Post('heartbeat')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Keep session alive via heartbeat' })
  @ApiResponse({ status: 200, description: 'Heartbeat acknowledged and session extended' })
  async heartbeat(@Body() dto: RefreshTokenDto) {
    return this.authService.heartbeat(dto.refreshToken);
  }
}
