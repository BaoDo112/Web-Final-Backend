import { IsString, IsOptional } from 'class-validator';

export class SubmitResponseDto {
    @IsString()
    questionId: string;

    @IsString()
    @IsOptional()
    videoUrl?: string;

    @IsString()
    @IsOptional()
    audioUrl?: string;

    @IsString()
    @IsOptional()
    transcript?: string;
}
