import { Injectable, UnauthorizedException, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { Role, AuthProvider, TokenType } from '@prisma/client';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        private mailService: MailService,
        private prisma: PrismaService,
    ) { }

    async validateUser(email: string, pass: string): Promise<any> {
        const user = await this.usersService.findOne(email);
        if (user && user.password && (await bcrypt.compare(pass, user.password))) {
            // Check if email is verified (skip for Google OAuth users)
            if (!user.isVerified && user.provider !== 'GOOGLE') {
                throw new UnauthorizedException('Please verify your email before logging in');
            }
            const { password, ...result } = user;
            return result;
        }
        return null;
    }

    async login(user: any) {
        const payload = { email: user.email, sub: user.id, role: user.role };
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                avatar: user.avatar,
            }
        };
    }

    // ═══════════════════════════════════════════════════════════════
    // GET FULL PROFILE
    // ═══════════════════════════════════════════════════════════════
    async getFullProfile(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                interviewerProfile: true,
            },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return {
            id: user.id,
            email: user.email,
            name: user.name,
            phone: user.phone,
            location: user.location,
            bio: user.bio,
            gender: user.gender,
            dateOfBirth: user.dateOfBirth,
            avatar: user.avatar,
            role: user.role,
            isActive: user.isActive,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            interviewerProfile: user.interviewerProfile,
        };
    }

    async register(createUserDto: CreateUserDto) {
        if (!createUserDto.password) {
            throw new ConflictException('Password is required for registration');
        }

        const existingUser = await this.usersService.findOne(createUserDto.email);
        if (existingUser) {
            throw new ConflictException('Email already registered');
        }

        const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
        const user = await this.usersService.create({
            ...createUserDto,
            password: hashedPassword,
        });

        const verificationToken = randomBytes(32).toString('hex');
        await this.prisma.token.create({
            data: {
                token: verificationToken,
                type: TokenType.EMAIL_VERIFY,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
                userId: user.id,
            },
        });

        this.mailService.sendVerificationEmail(
            user.email,
            user.name || 'User',
            verificationToken
        ).catch(err => console.error('Failed to send verification email:', err));

        return {
            message: 'Registration successful. Please check your email to verify your account.',
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            }
        };
    }

    async verifyEmail(token: string) {
        const tokenRecord = await this.prisma.token.findUnique({
            where: { token },
            include: { user: true },
        });

        if (!tokenRecord || tokenRecord.type !== TokenType.EMAIL_VERIFY) {
            throw new ConflictException('Invalid verification token');
        }

        if (tokenRecord.expiresAt < new Date()) {
            await this.prisma.token.delete({ where: { id: tokenRecord.id } });
            throw new ConflictException('Verification token has expired');
        }

        await this.prisma.user.update({
            where: { id: tokenRecord.userId },
            data: { isVerified: true },
        });

        await this.prisma.token.delete({ where: { id: tokenRecord.id } });

        return { message: 'Email verified successfully' };
    }

    // ═══════════════════════════════════════════════════════════════
    // UPDATE PROFILE
    // ═══════════════════════════════════════════════════════════════
    async updateProfile(userId: string, updateData: {
        name?: string;
        phone?: string;
        location?: string;
        bio?: string;
        gender?: string;
        dateOfBirth?: string;
        avatar?: string;
    }) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Validate gender enum
        const validGenders = ['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'];
        const gender = updateData.gender && validGenders.includes(updateData.gender)
            ? updateData.gender
            : undefined;

        // Parse date safely
        let dateOfBirth: Date | undefined = undefined;
        if (updateData.dateOfBirth) {
            const parsed = new Date(updateData.dateOfBirth);
            if (!isNaN(parsed.getTime())) {
                dateOfBirth = parsed;
            }
        }

        try {
            const updatedUser = await this.prisma.user.update({
                where: { id: userId },
                data: {
                    name: updateData.name || undefined,
                    phone: updateData.phone || undefined,
                    location: updateData.location || undefined,
                    bio: updateData.bio || undefined,
                    gender: gender as any,
                    dateOfBirth,
                    avatar: updateData.avatar || undefined,
                },
            });

            return {
                message: 'Profile updated successfully',
                user: {
                    id: updatedUser.id,
                    email: updatedUser.email,
                    name: updatedUser.name,
                    phone: updatedUser.phone,
                    location: updatedUser.location,
                    bio: updatedUser.bio,
                    gender: updatedUser.gender,
                    dateOfBirth: updatedUser.dateOfBirth,
                    avatar: updatedUser.avatar,
                    role: updatedUser.role,
                }
            };
        } catch (error) {
            console.error('Error updating profile:', error);
            throw new BadRequestException('Failed to update profile');
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // CHANGE PASSWORD
    // ═══════════════════════════════════════════════════════════════
    async changePassword(userId: string, currentPassword: string, newPassword: string) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new NotFoundException('User not found');
        }

        if (!user.password) {
            throw new BadRequestException('Cannot change password for OAuth accounts');
        }

        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordValid) {
            throw new BadRequestException('Current password is incorrect');
        }

        if (newPassword.length < 6) {
            throw new BadRequestException('New password must be at least 6 characters');
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await this.prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        });

        return { message: 'Password changed successfully' };
    }

    // ═══════════════════════════════════════════════════════════════
    // FORGOT PASSWORD - Send magic link
    // ═══════════════════════════════════════════════════════════════
    async forgotPassword(email: string) {
        const user = await this.usersService.findOne(email);

        // Always return success to prevent email enumeration
        if (!user) {
            return { message: 'If an account exists with this email, you will receive a password reset link.' };
        }

        if (user.provider === AuthProvider.GOOGLE) {
            return { message: 'This account uses Google login. Please sign in with Google.' };
        }

        // Delete any existing password reset tokens for this user
        await this.prisma.token.deleteMany({
            where: {
                userId: user.id,
                type: TokenType.PASSWORD_RESET,
            },
        });

        // Create new reset token
        const resetToken = randomBytes(32).toString('hex');
        await this.prisma.token.create({
            data: {
                token: resetToken,
                type: TokenType.PASSWORD_RESET,
                expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
                userId: user.id,
            },
        });

        // Send reset email
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
        const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

        await this.mailService.sendPasswordResetEmail(
            user.email,
            user.name || 'User',
            resetLink
        ).catch(err => console.error('Failed to send password reset email:', err));

        return { message: 'If an account exists with this email, you will receive a password reset link.' };
    }

    // ═══════════════════════════════════════════════════════════════
    // RESET PASSWORD - With token from email
    // ═══════════════════════════════════════════════════════════════
    async resetPassword(token: string, newPassword: string) {
        const tokenRecord = await this.prisma.token.findUnique({
            where: { token },
            include: { user: true },
        });

        if (!tokenRecord || tokenRecord.type !== TokenType.PASSWORD_RESET) {
            throw new BadRequestException('Invalid or expired reset token');
        }

        if (tokenRecord.expiresAt < new Date()) {
            await this.prisma.token.delete({ where: { id: tokenRecord.id } });
            throw new BadRequestException('Reset token has expired');
        }

        if (newPassword.length < 6) {
            throw new BadRequestException('Password must be at least 6 characters');
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await this.prisma.user.update({
            where: { id: tokenRecord.userId },
            data: { password: hashedPassword },
        });

        await this.prisma.token.delete({ where: { id: tokenRecord.id } });

        return { message: 'Password reset successfully. You can now log in with your new password.' };
    }

    // ═══════════════════════════════════════════════════════════════
    // DELETE ACCOUNT (Soft delete)
    // ═══════════════════════════════════════════════════════════════
    async deleteAccount(userId: string, password: string) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new NotFoundException('User not found');
        }

        // For local accounts, verify password
        if (user.provider === AuthProvider.LOCAL && user.password) {
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                throw new BadRequestException('Password is incorrect');
            }
        }

        // Soft delete - set deletedAt timestamp
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                deletedAt: new Date(),
                isActive: false,
            },
        });

        return { message: 'Account deleted successfully' };
    }

    // ═══════════════════════════════════════════════════════════════
    // GOOGLE LOGIN
    // ═══════════════════════════════════════════════════════════════
    async googleLogin(req) {
        if (!req.user) {
            return 'No user from google';
        }

        const { email, firstName, lastName, picture } = req.user;
        let user = await this.usersService.findOne(email);

        if (!user) {
            user = await this.usersService.create({
                email,
                name: `${firstName} ${lastName}`,
                avatar: picture,
                provider: AuthProvider.GOOGLE,
                providerId: 'google-oauth',
                password: '',
                role: Role.INTERVIEWEE
            });
        }

        const payload = { email: user.email, sub: user.id, role: user.role };
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                avatar: user.avatar,
            }
        };
    }
}
