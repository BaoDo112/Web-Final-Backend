import { Controller, Request, Post, UseGuards, Body, Get, Query, Put, Delete, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    // ═══════════════════════════════════════════════════════════════
    // LOGIN
    // ═══════════════════════════════════════════════════════════════
    @UseGuards(LocalAuthGuard)
    @Post('login')
    @ApiOperation({ summary: 'Login with email and password' })
    @ApiBody({ type: LoginDto })
    @ApiResponse({ status: 200, description: 'Return JWT access token and user info.' })
    @ApiResponse({ status: 401, description: 'Invalid credentials or email not verified.' })
    async login(@Request() req) {
        return this.authService.login(req.user);
    }

    // ═══════════════════════════════════════════════════════════════
    // REGISTER
    // ═══════════════════════════════════════════════════════════════
    @Post('register')
    @ApiOperation({ summary: 'Register a new user' })
    @ApiResponse({ status: 201, description: 'User registered. Verification email sent.' })
    @ApiResponse({ status: 409, description: 'Email already registered.' })
    async register(@Body() createUserDto: CreateUserDto) {
        return this.authService.register(createUserDto);
    }

    // ═══════════════════════════════════════════════════════════════
    // VERIFY EMAIL
    // ═══════════════════════════════════════════════════════════════
    @Get('verify-email')
    @ApiOperation({ summary: 'Verify email with token' })
    @ApiQuery({ name: 'token', required: true, description: 'Email verification token' })
    @ApiResponse({ status: 200, description: 'Email verified successfully.' })
    @ApiResponse({ status: 409, description: 'Invalid or expired token.' })
    async verifyEmail(@Query('token') token: string) {
        return this.authService.verifyEmail(token);
    }

    // ═══════════════════════════════════════════════════════════════
    // GET PROFILE
    // ═══════════════════════════════════════════════════════════════
    @UseGuards(JwtAuthGuard)
    @Get('profile')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get current user profile' })
    @ApiResponse({ status: 200, description: 'Returns user profile.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    getProfile(@Request() req) {
        return req.user;
    }

    // ═══════════════════════════════════════════════════════════════
    // UPDATE PROFILE
    // ═══════════════════════════════════════════════════════════════
    @UseGuards(JwtAuthGuard)
    @Put('profile')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update user profile' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                name: { type: 'string', example: 'Nguyễn Văn A' },
                phone: { type: 'string', example: '0912345678' },
                location: { type: 'string', example: 'TP. Hồ Chí Minh' },
                bio: { type: 'string', example: 'Software Developer' },
                gender: { type: 'string', enum: ['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'] },
                dateOfBirth: { type: 'string', example: '1995-01-15' },
                avatar: { type: 'string', example: 'https://example.com/avatar.jpg' },
            },
        },
    })
    @ApiResponse({ status: 200, description: 'Profile updated successfully.' })
    async updateProfile(@Request() req, @Body() updateData: any) {
        return this.authService.updateProfile(req.user.id, updateData);
    }

    // ═══════════════════════════════════════════════════════════════
    // CHANGE PASSWORD
    // ═══════════════════════════════════════════════════════════════
    @UseGuards(JwtAuthGuard)
    @Put('change-password')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Change password for authenticated user' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                currentPassword: { type: 'string', example: 'oldPassword123' },
                newPassword: { type: 'string', example: 'newPassword456' },
            },
            required: ['currentPassword', 'newPassword'],
        },
    })
    @ApiResponse({ status: 200, description: 'Password changed successfully.' })
    @ApiResponse({ status: 400, description: 'Current password is incorrect.' })
    async changePassword(@Request() req, @Body() body: { currentPassword: string; newPassword: string }) {
        return this.authService.changePassword(req.user.id, body.currentPassword, body.newPassword);
    }

    // ═══════════════════════════════════════════════════════════════
    // FORGOT PASSWORD - Send reset email
    // ═══════════════════════════════════════════════════════════════
    @Post('forgot-password')
    @ApiOperation({ summary: 'Request password reset email' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                email: { type: 'string', example: 'user@example.com' },
            },
            required: ['email'],
        },
    })
    @ApiResponse({ status: 200, description: 'Reset email sent if account exists.' })
    async forgotPassword(@Body() body: { email: string }) {
        return this.authService.forgotPassword(body.email);
    }

    // ═══════════════════════════════════════════════════════════════
    // RESET PASSWORD - With token from email
    // ═══════════════════════════════════════════════════════════════
    @Post('reset-password')
    @ApiOperation({ summary: 'Reset password with token from email' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                token: { type: 'string', description: 'Reset token from email' },
                newPassword: { type: 'string', example: 'newPassword456' },
            },
            required: ['token', 'newPassword'],
        },
    })
    @ApiResponse({ status: 200, description: 'Password reset successfully.' })
    @ApiResponse({ status: 400, description: 'Invalid or expired token.' })
    async resetPassword(@Body() body: { token: string; newPassword: string }) {
        return this.authService.resetPassword(body.token, body.newPassword);
    }

    // ═══════════════════════════════════════════════════════════════
    // DELETE ACCOUNT
    // ═══════════════════════════════════════════════════════════════
    @UseGuards(JwtAuthGuard)
    @Delete('account')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete user account (soft delete)' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                password: { type: 'string', description: 'Current password for verification' },
            },
            required: ['password'],
        },
    })
    @ApiResponse({ status: 200, description: 'Account deleted successfully.' })
    @ApiResponse({ status: 400, description: 'Password is incorrect.' })
    async deleteAccount(@Request() req, @Body() body: { password: string }) {
        return this.authService.deleteAccount(req.user.id, body.password);
    }

    // ═══════════════════════════════════════════════════════════════
    // GOOGLE OAUTH
    // ═══════════════════════════════════════════════════════════════
    @Get('google')
    @UseGuards(AuthGuard('google'))
    @ApiOperation({ summary: 'Initiate Google OAuth' })
    async googleAuth(@Request() req) { }

    @Get('google/callback')
    @UseGuards(AuthGuard('google'))
    @ApiOperation({ summary: 'Google OAuth Callback' })
    async googleAuthRedirect(@Request() req, @Res() res) {
        const result = await this.authService.googleLogin(req);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';

        // Handle error case (result is string if error)
        if (typeof result === 'string') {
            return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent(result)}`);
        }

        // Redirect to frontend with token as query parameter
        const redirectUrl = `${frontendUrl}/auth/callback?token=${result.access_token}&user=${encodeURIComponent(JSON.stringify(result.user))}`;
        return res.redirect(redirectUrl);
    }
}
