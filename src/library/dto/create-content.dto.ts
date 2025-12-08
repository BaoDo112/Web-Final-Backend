import { IsString, IsEnum, IsArray, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContentType, Difficulty, ContentStatus } from '@prisma/client';

export class CreateContentDto {
    @ApiProperty({ description: 'Content title', example: 'ReactJS Interview Questions' })
    @IsString()
    title: string;

    @ApiProperty({ description: 'URL-friendly slug', example: 'reactjs-interview-questions' })
    @IsString()
    slug: string;

    @ApiPropertyOptional({ description: 'Content description', example: 'A comprehensive set of ReactJS interview questions' })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiPropertyOptional({ description: 'Main content body (markdown/html)', example: '<p>Content here</p>' })
    @IsString()
    @IsOptional()
    body?: string;

    @ApiProperty({ description: 'Content type', enum: ['ARTICLE', 'VIDEO', 'QUESTION_SET'], example: 'QUESTION_SET' })
    @IsEnum(ContentType)
    type: ContentType;

    @ApiPropertyOptional({ description: 'Difficulty level', enum: ['EASY', 'MEDIUM', 'HARD'], example: 'MEDIUM' })
    @IsEnum(Difficulty)
    @IsOptional()
    difficulty?: Difficulty;

    @ApiPropertyOptional({ description: 'Content category', example: 'Frontend' })
    @IsString()
    @IsOptional()
    category?: string;

    @ApiPropertyOptional({ description: 'Tags array', example: ['react', 'javascript', 'frontend'], type: [String] })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    tags?: string[];

    @ApiPropertyOptional({ description: 'Thumbnail URL', example: 'https://cdn.nervis.dev/content/123/thumbnail.jpg' })
    @IsString()
    @IsOptional()
    thumbnailUrl?: string;

    @ApiPropertyOptional({ description: 'Video URL', example: 'https://cdn.nervis.dev/content/123/video.mp4' })
    @IsString()
    @IsOptional()
    videoUrl?: string;

    @ApiPropertyOptional({ description: 'Attached file URLs', example: ['https://cdn.nervis.dev/content/123/files/doc.pdf'], type: [String] })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    fileUrls?: string[];

    @ApiPropertyOptional({ description: 'Questions JSON for QUESTION_SET type', example: { questions: [] } })
    @IsOptional()
    questions?: any;

    @ApiPropertyOptional({ description: 'Duration in minutes', example: 30 })
    @IsNumber()
    @IsOptional()
    duration?: number;

    @ApiPropertyOptional({ description: 'Read time in minutes', example: 10 })
    @IsNumber()
    @IsOptional()
    readTime?: number;

    @ApiPropertyOptional({ description: 'Content status', enum: ['DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'ARCHIVED'], example: 'DRAFT' })
    @IsEnum(ContentStatus)
    @IsOptional()
    status?: ContentStatus;
}
