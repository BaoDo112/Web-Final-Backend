import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
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

    async register(createUserDto: CreateUserDto) {
        if (!createUserDto.password) {
            throw new ConflictException('Password is required for registration');
        }

        // Check if user already exists
        const existingUser = await this.usersService.findOne(createUserDto.email);
        if (existingUser) {
            throw new ConflictException('Email already registered');
        }

        const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
        const user = await this.usersService.create({
            ...createUserDto,
            password: hashedPassword,
        });

        // Create verification token
        const verificationToken = randomBytes(32).toString('hex');
        await this.prisma.token.create({
            data: {
                token: verificationToken,
                type: TokenType.EMAIL_VERIFY,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
                userId: user.id,
            },
        });

        // Send verification email (fire and forget)
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

        if (!tokenRecord) {
            throw new ConflictException('Invalid verification token');
        }

        if (tokenRecord.expiresAt < new Date()) {
            await this.prisma.token.delete({ where: { id: tokenRecord.id } });
            throw new ConflictException('Verification token has expired');
        }

        // Mark user as verified
        await this.prisma.user.update({
            where: { id: tokenRecord.userId },
            data: { isVerified: true },
        });

        // Delete the used token
        await this.prisma.token.delete({ where: { id: tokenRecord.id } });

        return { message: 'Email verified successfully' };
    }

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
