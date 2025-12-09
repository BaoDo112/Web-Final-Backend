import { Controller, Get, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';

@ApiTags('users')
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get('interviewers')
    @ApiOperation({ summary: 'Get list of approved interviewers/mentors' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'skill', required: false, type: String })
    @ApiQuery({ name: 'minRating', required: false, type: Number })
    @ApiQuery({ name: 'sortBy', required: false, enum: ['rating', 'sessions', 'price'] })
    async getInterviewers(
        @Query('page') page = 1,
        @Query('limit') limit = 10,
        @Query('skill') skill?: string,
        @Query('minRating') minRating?: number,
        @Query('sortBy') sortBy?: 'rating' | 'sessions' | 'price',
    ) {
        return this.usersService.getInterviewers({
            page: +page,
            limit: +limit,
            skill,
            minRating: minRating ? +minRating : undefined,
            sortBy,
        });
    }

    @Get('interviewers/:id')
    @ApiOperation({ summary: 'Get interviewer profile by ID' })
    async getInterviewerProfile(@Param('id') id: string) {
        return this.usersService.getInterviewerProfile(id);
    }

    @Put('interviewer-profile')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update interviewer profile (for INTERVIEWER role)' })
    async updateInterviewerProfile(
        @Request() req,
        @Body() updateData: {
            title?: string;
            company?: string;
            bio?: string;
            skills?: string[];
            experience?: number;
            hourlyRate?: number;
            cvUrl?: string;
            linkedinUrl?: string;
            availability?: any;
        },
    ) {
        return this.usersService.updateInterviewerProfile(req.user.id, updateData);
    }
}
