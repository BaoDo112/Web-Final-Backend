import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { BookingService } from './booking.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiQuery, ApiBody } from '@nestjs/swagger';
import { BookingStatus } from '@prisma/client';

@ApiTags('bookings')
@Controller('bookings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BookingController {
    constructor(private readonly bookingService: BookingService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new booking' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                mentorId: { type: 'string' },
                startTime: { type: 'string', format: 'date-time' },
                endTime: { type: 'string', format: 'date-time' },
                duration: { type: 'number', default: 60 },
                note: { type: 'string' },
            },
            required: ['mentorId', 'startTime', 'endTime'],
        },
    })
    async create(
        @Request() req,
        @Body() createBookingDto: any
    ) {
        return this.bookingService.create(req.user.id, createBookingDto);
    }

    @Get()
    @ApiOperation({ summary: 'Get my bookings' })
    @ApiQuery({ name: 'status', required: false, enum: BookingStatus })
    async getMyBookings(
        @Request() req,
        @Query('status') status?: BookingStatus
    ) {
        return this.bookingService.getMyBookings(req.user.id, req.user.role, status);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get booking by ID' })
    async findOne(@Request() req, @Param('id') id: string) {
        return this.bookingService.findOne(id, req.user.id);
    }

    @Post(':id/confirm')
    @ApiOperation({ summary: 'Confirm booking (mentor only)' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                meetingLink: { type: 'string', example: 'https://meet.google.com/xxx' },
            },
        },
    })
    async confirm(
        @Request() req,
        @Param('id') id: string,
        @Body() body: { meetingLink?: string }
    ) {
        const meetingLink = body?.meetingLink;
        return this.bookingService.confirm(id, req.user.id, meetingLink);
    }

    @Post(':id/cancel')
    @ApiOperation({ summary: 'Cancel booking' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                cancelReason: { type: 'string' },
            },
        },
    })
    async cancel(
        @Request() req,
        @Param('id') id: string,
        @Body() body: { cancelReason?: string }
    ) {
        return this.bookingService.cancel(id, req.user.id, body.cancelReason);
    }

    @Post(':id/complete')
    @ApiOperation({ summary: 'Mark booking as completed (mentor only)' })
    async complete(@Request() req, @Param('id') id: string) {
        return this.bookingService.complete(id, req.user.id);
    }
}
