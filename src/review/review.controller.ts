import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ReviewService } from './review.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiQuery, ApiBody } from '@nestjs/swagger';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewController {
    constructor(private readonly reviewService: ReviewService) { }

    @Post()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create a new review' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                rating: { type: 'number', minimum: 1, maximum: 5 },
                comment: { type: 'string' },
                bookingId: { type: 'string' },
                contentId: { type: 'string' },
                targetUserId: { type: 'string' },
            },
            required: ['rating'],
        },
    })
    async create(@Request() req, @Body() createReviewDto: any) {
        return this.reviewService.create(req.user.id, createReviewDto);
    }

    @Get('content/:contentId')
    @ApiOperation({ summary: 'Get reviews for a content' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    async getContentReviews(
        @Param('contentId') contentId: string,
        @Query('page') page = 1,
        @Query('limit') limit = 10
    ) {
        return this.reviewService.getContentReviews(contentId, +page, +limit);
    }

    @Get('user/:userId')
    @ApiOperation({ summary: 'Get reviews for a user (interviewer)' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    async getUserReviews(
        @Param('userId') userId: string,
        @Query('page') page = 1,
        @Query('limit') limit = 10
    ) {
        return this.reviewService.getUserReviews(userId, +page, +limit);
    }

    @Put(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update a review' })
    async update(
        @Request() req,
        @Param('id') id: string,
        @Body() updateData: { rating?: number; comment?: string }
    ) {
        return this.reviewService.update(id, req.user.id, updateData);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete a review' })
    async delete(@Request() req, @Param('id') id: string) {
        return this.reviewService.delete(id, req.user.id);
    }
}
