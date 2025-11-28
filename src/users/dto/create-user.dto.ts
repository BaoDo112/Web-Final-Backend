import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional, IsEnum } from 'class-validator';
import { Role, AuthProvider } from '@prisma/client';

export class CreateUserDto {
    @IsEmail()
    email: string;

    @IsString()
    @IsOptional()
    @MinLength(6)
    password?: string;

    @IsString()
    @IsOptional()
    name?: string;

    @IsEnum(Role)
    @IsOptional()
    role?: Role;

    @IsEnum(AuthProvider)
    @IsOptional()
    provider?: AuthProvider;

    @IsString()
    @IsOptional()
    providerId?: string;

    @IsString()
    @IsOptional()
    avatar?: string;
}
