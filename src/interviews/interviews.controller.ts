import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { InterviewsService } from './interviews.service';
import { StartInterviewDto } from './dto/start-interview.dto';
import { SubmitResponseDto } from './dto/submit-response.dto';

@Controller('interviews')
export class InterviewsController {
    constructor(private readonly interviewsService: InterviewsService) { }

    @Post('start')
    async startSession(@Body() startInterviewDto: StartInterviewDto) {
        return this.interviewsService.startSession(startInterviewDto);
    }

    @Post(':id/submit')
    async submitResponse(
        @Param('id') id: string,
        @Body() submitResponseDto: SubmitResponseDto,
    ) {
        return this.interviewsService.submitResponse(id, submitResponseDto);
    }

    @Get(':id')
    async getSession(@Param('id') id: string) {
        return this.interviewsService.getSession(id);
    }

    @Get('history/user')
    async getUserHistory(@Query('userId') userId: string) {
        return this.interviewsService.getUserHistory(userId);
    }
}
