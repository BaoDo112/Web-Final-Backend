import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { Role } from '@prisma/client';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
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
        };
    }

    async register(createUserDto: CreateUserDto) {
        if (!createUserDto.password) {
            throw new Error('Password is required for registration');
        }
        const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
        return this.usersService.create({
            ...createUserDto,
            password: hashedPassword,
        });
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
                provider: 'GOOGLE',
                providerId: 'google-oauth',
                password: '',
                role: Role.INTERVIEWEE
            });
        }

        const payload = { email: user.email, sub: user.id, role: user.role };
        return {
            access_token: this.jwtService.sign(payload),
            user
        };
    }
}
