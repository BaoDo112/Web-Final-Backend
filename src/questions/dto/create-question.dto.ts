import { IsString, IsEnum, IsArray, IsOptional } from 'class-validator';
import { Difficulty } from '@prisma/client';

export class CreateQuestionDto {
    @IsString()
    content: string;

    @IsEnum(Difficulty)
    difficulty: Difficulty;

    @IsString()
    category: string;

    @IsArray()
    @IsString({ each: true })
    tags: string[];
}

export class GetQuestionsFilterDto {
    @IsOptional()
    @IsEnum(Difficulty)
    difficulty?: Difficulty;

    @IsOptional()
    @IsString()
    category?: string;
}
