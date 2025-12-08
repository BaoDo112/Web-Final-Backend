import { IsString, IsEnum, IsArray, IsOptional } from 'class-validator';
import { ContentType, Difficulty, ContentStatus } from '@prisma/client';

export class CreateContentDto {
    @IsString()
    title: string;

    @IsString()
    slug: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    body?: string;

    @IsEnum(ContentType)
    type: ContentType;

    @IsEnum(Difficulty)
    @IsOptional()
    difficulty?: Difficulty;

    @IsString()
    @IsOptional()
    category?: string;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    tags?: string[];

    @IsString()
    @IsOptional()
    thumbnailUrl?: string;

    @IsString()
    @IsOptional()
    videoUrl?: string;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    fileUrls?: string[];

    @IsOptional()
    questions?: any; // JSON for QUESTION_SET type

    @IsOptional()
    duration?: number;

    @IsOptional()
    readTime?: number;

    @IsEnum(ContentStatus)
    @IsOptional()
    status?: ContentStatus;
}
