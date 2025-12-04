import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
// import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('chat')
export class ChatController {
    constructor(private readonly chatService: ChatService) { }

    @Post(':bookingId')
    // @UseGuards(JwtAuthGuard)
    async sendMessage(
        @Request() req,
        @Param('bookingId') bookingId: string,
        @Body() sendMessageDto: SendMessageDto,
    ) {
        // TODO: Get userId from JWT
        const mockUserId = 'user-id-placeholder';
        return this.chatService.sendMessage(mockUserId, bookingId, sendMessageDto);
    }

    @Get(':bookingId')
    // @UseGuards(JwtAuthGuard)
    async getMessages(
        @Request() req,
        @Param('bookingId') bookingId: string,
    ) {
        // TODO: Get userId from JWT
        const mockUserId = 'user-id-placeholder';
        return this.chatService.getMessages(mockUserId, bookingId);
    }
}
