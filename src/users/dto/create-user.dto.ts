import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional, IsEnum, IsArray, IsNumber, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role, AuthProvider } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateInterviewerProfileDto {
    @ApiPropertyOptional({ example: 'Senior Software Engineer' })
    @IsString()
    @IsOptional()
    title?: string;

    @ApiPropertyOptional({ example: 'Google' })
    @IsString()
    @IsOptional()
    company?: string;

    @ApiPropertyOptional({ example: 5 })
    @IsNumber()
    @IsOptional()
    experience?: number;

    @ApiPropertyOptional({ example: ['React', 'Node.js'] })
    @IsArray()
    @IsOptional()
    skills?: string[];

    @ApiPropertyOptional({ example: 'Experienced engineer with...' })
    @IsString()
    @IsOptional()
    bio?: string;

    @ApiPropertyOptional({ example: 'https://linkedin.com/in/...' })
    @IsString()
    @IsOptional()
    linkedinUrl?: string;
}

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

    @ApiPropertyOptional({ description: 'Interviewer profile data (for INTERVIEWER role)' })
    @ValidateNested()
    @Type(() => CreateInterviewerProfileDto)
    @IsOptional()
    interviewerProfile?: CreateInterviewerProfileDto;
}
