import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { QuestionsService } from './questions.service';
import { CreateQuestionDto, GetQuestionsFilterDto } from './dto/create-question.dto';
// import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // Uncomment when Auth is ready
// import { Roles } from '../auth/roles.decorator';
// import { Role } from '../auth/role.enum';

@Controller('questions')
export class QuestionsController {
    constructor(private readonly questionsService: QuestionsService) { }

    @Post()
    // @UseGuards(JwtAuthGuard)
    // @Roles(Role.ADMIN)
    async create(@Body() createQuestionDto: CreateQuestionDto) {
        return this.questionsService.create(createQuestionDto);
    }

    @Get()
    async findAll(@Query() filter: GetQuestionsFilterDto) {
        return this.questionsService.findAll(filter);
    }

    @Get('random')
    async findRandom(
        @Query('count') count: string,
        @Query('difficulty') difficulty?: string,
    ) {
        return this.questionsService.findRandom(parseInt(count) || 5, difficulty);
    }
}
