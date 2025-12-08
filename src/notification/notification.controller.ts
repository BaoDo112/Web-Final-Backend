import { Controller, Get, Post, Delete, Param, Query, UseGuards, Request } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationController {
    constructor(private readonly notificationService: NotificationService) { }

    @Get()
    @ApiOperation({ summary: 'Get my notifications' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    async getMyNotifications(
        @Request() req,
        @Query('page') page = 1,
        @Query('limit') limit = 20
    ) {
        return this.notificationService.getMyNotifications(req.user.id, +page, +limit);
    }

    @Post(':id/read')
    @ApiOperation({ summary: 'Mark notification as read' })
    async markAsRead(@Request() req, @Param('id') id: string) {
        return this.notificationService.markAsRead(id, req.user.id);
    }

    @Post('read-all')
    @ApiOperation({ summary: 'Mark all notifications as read' })
    async markAllAsRead(@Request() req) {
        return this.notificationService.markAllAsRead(req.user.id);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a notification' })
    async delete(@Request() req, @Param('id') id: string) {
        return this.notificationService.delete(id, req.user.id);
    }
}
