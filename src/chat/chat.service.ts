import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SendMessageDto } from './dto/send-message.dto';

@Injectable()
export class ChatService {
    constructor(private prisma: PrismaService) { }

    async sendMessage(userId: string, bookingId: string, sendMessageDto: SendMessageDto) {
        const booking = await this.prisma.booking.findUnique({
            where: { id: bookingId },
        });

        if (!booking) {
            throw new NotFoundException('Booking not found');
        }

        // Verify user is part of the booking
        if (booking.userId !== userId && booking.mentorId !== userId) {
            throw new NotFoundException('You are not a participant of this booking');
        }

        return this.prisma.message.create({
            data: {
                content: sendMessageDto.content,
                bookingId,
                senderId: userId,
            },
            include: {
                sender: {
                    select: { id: true, name: true, avatar: true },
                },
            },
        });
    }

    async getMessages(userId: string, bookingId: string) {
        const booking = await this.prisma.booking.findUnique({
            where: { id: bookingId },
        });

        if (!booking) {
            throw new NotFoundException('Booking not found');
        }

        if (booking.userId !== userId && booking.mentorId !== userId) {
            throw new NotFoundException('You are not a participant of this booking');
        }

        return this.prisma.message.findMany({
            where: { bookingId },
            orderBy: { createdAt: 'asc' },
            include: {
                sender: {
                    select: { id: true, name: true, avatar: true },
                },
            },
        });
    }
}
