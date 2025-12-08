import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role, AuthProvider } from '@prisma/client';

export class CreateUserDto {
    @ApiProperty({ example: 'user@example.com', description: 'Email address' })
    @IsEmail()
    email: string;

    @ApiPropertyOptional({ example: 'password123', description: 'Password (min 6 characters)', minLength: 6 })
    @IsString()
    @IsOptional()
    @MinLength(6)
    password?: string;

    @ApiPropertyOptional({ example: 'Nguyễn Văn A', description: 'Full name' })
    @IsString()
    @IsOptional()
    name?: string;

    @ApiPropertyOptional({ enum: ['ADMIN', 'INTERVIEWER', 'INTERVIEWEE'], example: 'INTERVIEWEE', description: 'User role' })
    @IsEnum(Role)
    @IsOptional()
    role?: Role;

    @ApiPropertyOptional({ enum: ['LOCAL', 'GOOGLE'], example: 'LOCAL', description: 'Auth provider' })
    @IsEnum(AuthProvider)
    @IsOptional()
    provider?: AuthProvider;

    @ApiPropertyOptional({ description: 'Provider ID for OAuth' })
    @IsString()
    @IsOptional()
    providerId?: string;

    @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg', description: 'Avatar URL' })
    @IsString()
    @IsOptional()
    avatar?: string;
}
