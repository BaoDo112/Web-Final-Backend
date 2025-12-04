import { IsString, IsEnum, IsArray, IsOptional } from 'class-validator';
import { PostType } from '@prisma/client';

export class CreatePostDto {
    @IsString()
    title: string;

    @IsString()
    content: string;

    @IsEnum(PostType)
    type: PostType;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    fileUrls?: string[];

    @IsString()
    @IsOptional()
    videoUrl?: string;
}
