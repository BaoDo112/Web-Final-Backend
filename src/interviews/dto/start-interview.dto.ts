import { IsString, IsEnum, IsOptional } from 'class-validator';
import { SessionType } from '@prisma/client';

export class StartInterviewDto {
    @IsString()
    userId: string; // Should be extracted from JWT in real app

    @IsEnum(SessionType)
    @IsOptional()
    type?: SessionType;
}
